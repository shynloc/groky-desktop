// Application constants and configuration

// Session limits
export const MAX_SESSIONS = 20;

// Display limits
export const MAX_APPROVAL_PREVIEW_LENGTH = 400;
export const MAX_TOOL_INPUT_DISPLAY_LENGTH = 180;
export const MAX_FILE_READ_BYTES = 100_000;
export const MAX_PROMPT_LENGTH = 100_000;

// Tool status
export const TOOL_STATUS = {
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// Message roles
export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

// Event types
export const EVENT_TYPE = {
  TEXT: 'text',
  CONTENT: 'content',
  THOUGHT: 'thought',
  END: 'end',
  ERROR: 'error',
  TOOL_USE: 'tool_use',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  TOOL_CALL_UPDATE: 'tool_call_update',
  TOOL_CALL_RESULT: 'tool_call_result',
  TOOL_PERMISSION: 'tool_permission',
  PERMISSION_REQUEST: 'permission_request',
} as const;

// Diff status
export const DIFF_STATUS = {
  PENDING: 'pending',
  APPLIED: 'applied',
  REJECTED: 'rejected',
} as const;

// Auth modes
export const AUTH_MODE = {
  SUBSCRIPTION: 'subscription',
  API_KEY: 'apikey',
} as const;

// Theme
export const THEME = {
  DARK: 'dark',
  LIGHT: 'light',
} as const;

// Language
export const LANGUAGE = {
  ZH: 'zh',
  EN: 'en',
} as const;

// Effort levels
export const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

// Model IDs
export type GrokModelId = string;

// File patterns to skip in file tree
export const SKIP_FILE_PATTERNS = [
  'node_modules',
  'target',
  'dist',
  '.git',
  '.next',
  'build',
  '__pycache__',
  '.venv',
];

// Sensitive file patterns to block
export const SENSITIVE_FILE_PATTERNS = [
  '.ssh/',
  '.gnupg/',
  '.aws/',
  '.config/',
  'id_rsa',
  'id_ed25519',
  'id_ecdsa',
  '.env',
  '.env.local',
  '.env.production',
  'credentials',
  'secrets',
  'password',
];

// Dangerous command patterns
export const DANGEROUS_COMMAND_PATTERNS = [
  'rm ',
  'delete',
  'drop ',
  'truncate',
  'format',
  'sudo',
  'chmod',
  'chown',
];

// Tool name patterns
export const TOOL_PATTERNS = {
  READ: /read|list|grep|search/i,
  WRITE: /write|edit|replace|patch/i,
  EDIT: /search_replace|edit_file|str_replace|apply_patch/i,
} as const;
