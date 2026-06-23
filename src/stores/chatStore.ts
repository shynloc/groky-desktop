import { create } from 'zustand';
import { ChatMessage, GrokEvent, ToolCall, ApprovalRequest, PendingDiff } from '../types';
import { safeParseRawToolCall, safeParseRawToolResult, safeParsePermissionRequest } from '../services/typeValidation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseToolCall(raw?: Record<string, unknown>, data?: string): ToolCall {
  // Use safe parsing with validation
  const validated = raw ? safeParseRawToolCall(raw) : null;
  
  const id =
    validated?.id ??
    validated?.tool_use_id ??
    `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const tool =
    validated?.name ??
    validated?.tool ??
    'unknown';

  const rawInput = validated?.input ?? validated?.parameters;
  const input = rawInput
    ? typeof rawInput === 'string'
      ? rawInput
      : JSON.stringify(rawInput)
    : data;

  const inputObj = typeof rawInput === 'object' && rawInput !== null
    ? rawInput as Record<string, unknown>
    : null;

  const filePath =
    (inputObj?.path as string) ??
    (inputObj?.file_path as string) ??
    undefined;

  return { id, tool, status: 'running', input, filePath };
}

function resolveToolResult(
  toolCalls: ToolCall[],
  raw?: Record<string, unknown>,
): ToolCall[] {
  // Use safe parsing with validation
  const validated = raw ? safeParseRawToolResult(raw) : null;
  
  const refId =
    validated?.tool_use_id ??
    validated?.id ??
    validated?.tool_call_id;

  const isError =
    validated?.is_error === true ||
    validated?.status === 'error';

  const rawOutput = validated?.content ?? validated?.output;
  const output =
    typeof rawOutput === 'string'
      ? rawOutput
      : rawOutput !== undefined
        ? JSON.stringify(rawOutput)
        : undefined;

  return toolCalls.map((tc) => {
    const matches = refId ? tc.id === refId : tc.status === 'running';
    if (matches) {
      return { ...tc, status: isError ? 'error' : 'success', output };
    }
    return tc;
  });
}

function extractDiff(
  toolCall: ToolCall,
  raw?: Record<string, unknown>,
): PendingDiff | null {
  const toolName = (raw?.name as string) ?? toolCall.tool ?? '';
  const isEditTool = /search_replace|edit_file|str_replace|apply_patch/i.test(toolName);
  if (!isEditTool) return null;

  const inp = (raw?.input ?? {}) as Record<string, unknown>;
  const oldStr = (inp.old_str ?? inp.old_string ?? inp.old ?? '') as string;
  const newStr = (inp.new_str ?? inp.new_string ?? inp.new ?? '') as string;
  const fp = (inp.path ?? inp.file_path ?? toolCall.filePath ?? 'unknown') as string;

  if (!oldStr && !newStr) return null;

  return {
    id: toolCall.id,
    filePath: String(fp),
    oldStr: String(oldStr),
    newStr: String(newStr),
    status: 'pending',
  };
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface ChatStore {
  // Messages
  messages: ChatMessage[];
  addUserMessage: (content: string) => void;
  addSystemMessage: (content: string) => void;
  handleGrokEvent: (event: GrokEvent) => void;
  clearMessages: () => void;

  // Streaming
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;

  // Approval
  pendingApproval: ApprovalRequest | null;
  setPendingApproval: (r: ApprovalRequest | null) => void;
  sessionAllowedTools: string[];
  allowToolForSession: (tool: string) => void;

  // Diffs
  pendingDiffs: PendingDiff[];
  resolveDiff: (id: string, action: 'applied' | 'rejected') => void;
  clearDiffs: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStore>((set) => ({
  // ── Messages ─────────────────────────────────────────────────────────────
  messages: [],

  addUserMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `user-${Date.now()}`, role: 'user', content },
      ],
    })),

  addSystemMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `sys-${Date.now()}`, role: 'system', content },
      ],
    })),

  handleGrokEvent: (event) =>
    set((s) => {
      const { type, data, raw_json } = event;
      const msgs = s.messages;
      const last = msgs[msgs.length - 1];

      // ── End signal ────────────────────────────────────────────────────────
      if (type === 'end') {
        const updates: Partial<ChatStore> = { isStreaming: false };

        if (last?.isStreaming) {
          updates.messages = [...msgs.slice(0, -1), { ...last, isStreaming: false }];
        }

        return updates;
      }

      // ── Error ─────────────────────────────────────────────────────────────
      if (type === 'error') {
        return {
          isStreaming: false,
          messages: [
            ...msgs,
            { id: `err-${Date.now()}`, role: 'system' as const, content: `Error: ${data}` },
          ],
        };
      }

      // ── Permission request ────────────────────────────────────────────────
      if (type === 'tool_permission' || type === 'permission_request') {
        const raw = raw_json ?? {};
        // Use safe parsing with validation
        const validated = safeParsePermissionRequest(raw);
        
        const tool = validated?.tool ?? validated?.name ?? 'unknown';

        // Auto-approve if tool is in session allow-list
        if (s.sessionAllowedTools.includes(tool)) {
          return {};
        }

        const request: ApprovalRequest = {
          id: `req-${Date.now()}`,
          tool,
          command: validated?.command,
          description: validated?.description,
          filePath: validated?.path ?? validated?.file_path,
          input: data || undefined,
        };
        return { pendingApproval: request };
      }

      // ── Text / thought ────────────────────────────────────────────────────
      if (type === 'text' || type === 'content' || type === 'thought') {
        if (last?.role === 'assistant' && last.isStreaming) {
          const updated: ChatMessage = { ...last };
          if (type === 'thought') {
            updated.thinking = (updated.thinking ?? '') + data;
          } else {
            updated.content = (updated.content ?? '') + data;
          }
          return { messages: [...msgs.slice(0, -1), updated] };
        }
        return {
          messages: [
            ...msgs,
            {
              id: `asst-${Date.now()}-${Math.random()}`,
              role: 'assistant' as const,
              content: type !== 'thought' ? data : '',
              thinking: type === 'thought' ? data : '',
              toolCalls: [],
              isStreaming: true,
            },
          ],
        };
      }

      // ── Tool call start ───────────────────────────────────────────────────
      if (type === 'tool_use' || type === 'tool_call') {
        const newCall = parseToolCall(raw_json, data);
        const diff = extractDiff(newCall, raw_json);
        const pendingDiffs = diff
          ? [...s.pendingDiffs, diff]
          : s.pendingDiffs;

        if (last?.role === 'assistant' && last.isStreaming) {
          return {
            pendingDiffs,
            messages: [
              ...msgs.slice(0, -1),
              { ...last, toolCalls: [...(last.toolCalls ?? []), newCall] },
            ],
          };
        }
        return {
          pendingDiffs,
          messages: [
            ...msgs,
            {
              id: `asst-${Date.now()}-${Math.random()}`,
              role: 'assistant' as const,
              content: '',
              toolCalls: [newCall],
              isStreaming: true,
            },
          ],
        };
      }

      // ── Tool result ───────────────────────────────────────────────────────
      if (
        type === 'tool_result' ||
        type === 'tool_call_update' ||
        type === 'tool_call_result'
      ) {
        if (last?.role === 'assistant' && last.isStreaming) {
          return {
            messages: [
              ...msgs.slice(0, -1),
              {
                ...last,
                toolCalls: resolveToolResult(last.toolCalls ?? [], raw_json),
              },
            ],
          };
        }
        return {};
      }

      return {};
    }),

  clearMessages: () => set({ messages: [], pendingDiffs: [] }),

  // ── Streaming ─────────────────────────────────────────────────────────────
  isStreaming: false,
  setIsStreaming: (v) => set({ isStreaming: v }),

  // ── Approval ──────────────────────────────────────────────────────────────
  pendingApproval: null,
  setPendingApproval: (r) => set({ pendingApproval: r }),
  sessionAllowedTools: [],
  allowToolForSession: (tool) =>
    set((s) => ({
      sessionAllowedTools: s.sessionAllowedTools.includes(tool)
        ? s.sessionAllowedTools
        : [...s.sessionAllowedTools, tool],
    })),

  // ── Diffs ─────────────────────────────────────────────────────────────────
  pendingDiffs: [],
  resolveDiff: (id, action) =>
    set((s) => ({
      pendingDiffs: s.pendingDiffs.map((d) =>
        d.id === id ? { ...d, status: action } : d
      ),
    })),
  clearDiffs: () => set({ pendingDiffs: [] }),
}));
