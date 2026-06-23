import { create } from 'zustand';
import { ChatMessage, GrokEvent, ToolCall, ApprovalRequest, PendingDiff, Session } from '../types';
import { GrokModelId, EffortLevel, AuthMode } from '../constants';
import { Language } from '../i18n';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseToolCall(raw?: Record<string, unknown>, data?: string): ToolCall {
  const id =
    (raw?.id as string) ??
    (raw?.tool_use_id as string) ??
    `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const tool =
    (raw?.name as string) ??
    (raw?.tool as string) ??
    'unknown';

  const rawInput = raw?.input ?? raw?.parameters;
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
  const refId =
    (raw?.tool_use_id as string) ??
    (raw?.id as string) ??
    (raw?.tool_call_id as string);

  const isError =
    !!(raw?.is_error) ||
    (raw?.status as string) === 'error';

  const rawOutput = raw?.content ?? raw?.output;
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

function loadSessions(): Session[] {
  try {
    const stored = localStorage.getItem('groky-sessions');
    return stored ? (JSON.parse(stored) as Session[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem('groky-sessions', JSON.stringify(sessions));
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface AppStore {
  // Project
  projectPath: string | null;
  setProjectPath: (path: string | null) => void;

  // Session
  currentSessionId: string | null;
  setSessionId: (id: string | null) => void;

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

  // Session history
  sessions: Session[];
  removeSession: (id: string) => void;

  // Settings
  model: GrokModelId;
  setModel: (m: GrokModelId) => void;
  effort: EffortLevel | null;
  setEffort: (e: EffortLevel | null) => void;
  planMode: boolean;
  togglePlanMode: () => void;
  alwaysApproveEnabled: boolean;
  toggleAlwaysApprove: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  // Auth
  authMode: AuthMode;
  setAuthMode: (m: AuthMode) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
  // Dynamic models (populated from `grok models`)
  dynamicModels: { id: string; label: string }[];
  setDynamicModels: (models: { id: string; label: string }[]) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppStore>((set) => ({
  // ── Project ──────────────────────────────────────────────────────────────
  projectPath: null,
  setProjectPath: (path) => set({ projectPath: path }),

  // ── Session ──────────────────────────────────────────────────────────────
  currentSessionId: null,
  setSessionId: (id) => set({ currentSessionId: id }),

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
      const { type, data, session_id, raw_json } = event;
      const msgs = s.messages;
      const last = msgs[msgs.length - 1];
      const sessionPatch = session_id ? { currentSessionId: session_id } : {};

      // ── End signal ────────────────────────────────────────────────────────
      if (type === 'end') {
        const updates: Partial<AppStore> = { ...sessionPatch, isStreaming: false };

        if (last?.isStreaming) {
          updates.messages = [...msgs.slice(0, -1), { ...last, isStreaming: false }];
        }

        // Persist session on first end-with-id
        const sid = session_id ?? s.currentSessionId;
        if (sid && s.projectPath && msgs.length > 0) {
          const firstUser = msgs.find((m) => m.role === 'user');
          if (firstUser) {
            const newSession: Session = {
              id: sid,
              projectPath: s.projectPath,
              projectName: s.projectPath.split('/').pop() || 'project',
              firstMessage: firstUser.content.slice(0, 80),
              timestamp: Date.now(),
            };
            const sessions = [newSession, ...s.sessions.filter((ss) => ss.id !== sid)].slice(0, 20);
            saveSessions(sessions);
            updates.sessions = sessions;
          }
        }

        return updates;
      }

      // ── Error ─────────────────────────────────────────────────────────────
      if (type === 'error') {
        return {
          ...sessionPatch,
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
        const tool = (raw.tool as string) ?? (raw.name as string) ?? 'unknown';

        // Auto-approve if tool is in session allow-list
        if (s.sessionAllowedTools.includes(tool)) {
          return sessionPatch;
        }

        const request: ApprovalRequest = {
          id: `req-${Date.now()}`,
          tool,
          command: raw.command as string | undefined,
          description: raw.description as string | undefined,
          filePath: (raw.path ?? raw.file_path) as string | undefined,
          input: data || undefined,
        };
        return { ...sessionPatch, pendingApproval: request };
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
          return { ...sessionPatch, messages: [...msgs.slice(0, -1), updated] };
        }
        return {
          ...sessionPatch,
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
            ...sessionPatch,
            pendingDiffs,
            messages: [
              ...msgs.slice(0, -1),
              { ...last, toolCalls: [...(last.toolCalls ?? []), newCall] },
            ],
          };
        }
        return {
          ...sessionPatch,
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
            ...sessionPatch,
            messages: [
              ...msgs.slice(0, -1),
              {
                ...last,
                toolCalls: resolveToolResult(last.toolCalls ?? [], raw_json),
              },
            ],
          };
        }
        return sessionPatch;
      }

      return sessionPatch;
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

  // ── Session history ───────────────────────────────────────────────────────
  sessions: loadSessions(),
  removeSession: (id) =>
    set((s) => {
      const sessions = s.sessions.filter((ss) => ss.id !== id);
      saveSessions(sessions);
      return { sessions };
    }),

  // ── Settings ──────────────────────────────────────────────────────────────
  model: (localStorage.getItem('groky-model') ?? 'grok-build'),
  setModel: (m) => { localStorage.setItem('groky-model', m); set({ model: m }); },
  effort: null,
  setEffort: (e) => set({ effort: e }),
  planMode: false,
  togglePlanMode: () => set((s) => ({ planMode: !s.planMode })),
  alwaysApproveEnabled: false,
  toggleAlwaysApprove: () => set((s) => ({ alwaysApproveEnabled: !s.alwaysApproveEnabled })),
  authMode: (localStorage.getItem('groky-auth-mode') as AuthMode | null) ?? 'subscription',
  setAuthMode: (m) => { localStorage.setItem('groky-auth-mode', m); set({ authMode: m }); },
  apiKey: localStorage.getItem('groky-api-key') ?? '',
  setApiKey: (k) => { localStorage.setItem('groky-api-key', k); set({ apiKey: k }); },
  dynamicModels: [],
  setDynamicModels: (models) => set({ dynamicModels: models }),
  language: (localStorage.getItem('groky-language') as Language | null) ?? 'zh',
  setLanguage: (l) => {
    localStorage.setItem('groky-language', l);
    set({ language: l });
  },
  theme: (localStorage.getItem('groky-theme') as 'dark' | 'light' | null) ?? 'dark',
  setTheme: (t) => {
    localStorage.setItem('groky-theme', t);
    set({ theme: t });
  },
}));
