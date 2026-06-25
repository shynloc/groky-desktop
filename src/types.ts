export interface ToolCall {
  id: string;
  tool: string;
  status: 'running' | 'success' | 'error';
  input?: string;
  output?: string;
  filePath?: string;
}

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  todos?: TodoItem[];
  isStreaming?: boolean;
  /** Original prompt text (stored for resend capability) */
  originalPrompt?: string;
}

export interface GrokEvent {
  type: string;
  data: string;
  session_id?: string;
  raw_json?: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  tool: string;
  command?: string;
  description?: string;
  filePath?: string;
  input?: string;
}

export interface PendingDiff {
  id: string;
  filePath: string;
  oldStr: string;
  newStr: string;
  status: 'pending' | 'applied' | 'rejected';
}

export interface Session {
  id: string;
  projectPath: string;
  projectName: string;
  firstMessage: string;
  timestamp: number;
}
