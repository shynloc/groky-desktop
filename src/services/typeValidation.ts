import { z } from 'zod';

// Schema for GrokEvent
export const GrokEventSchema = z.object({
  type: z.string(),
  data: z.string(),
  session_id: z.string().optional(),
  raw_json: z.record(z.string(), z.unknown()).optional(),
});

// Schema for raw tool call data
export const RawToolCallSchema = z.object({
  id: z.string().optional(),
  tool_use_id: z.string().optional(),
  name: z.string().optional(),
  tool: z.string().optional(),
  input: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  parameters: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
}).passthrough();

// Schema for tool result data
export const RawToolResultSchema = z.object({
  tool_use_id: z.string().optional(),
  id: z.string().optional(),
  tool_call_id: z.string().optional(),
  is_error: z.boolean().optional(),
  status: z.string().optional(),
  content: z.union([z.string(), z.unknown()]).optional(),
  output: z.union([z.string(), z.unknown()]).optional(),
}).passthrough();

// Schema for permission request
export const PermissionRequestSchema = z.object({
  tool: z.string().optional(),
  name: z.string().optional(),
  command: z.string().optional(),
  description: z.string().optional(),
  path: z.string().optional(),
  file_path: z.string().optional(),
}).passthrough();

// Type inference from schemas
export type RawToolCall = z.infer<typeof RawToolCallSchema>;
export type RawToolResult = z.infer<typeof RawToolResultSchema>;
export type PermissionRequest = z.infer<typeof PermissionRequestSchema>;

// Validation functions
export function validateGrokEvent(data: unknown): data is z.infer<typeof GrokEventSchema> {
  return GrokEventSchema.safeParse(data).success;
}

export function validateRawToolCall(data: unknown): data is RawToolCall {
  return RawToolCallSchema.safeParse(data).success;
}

export function validateRawToolResult(data: unknown): data is RawToolResult {
  return RawToolResultSchema.safeParse(data).success;
}

export function validatePermissionRequest(data: unknown): data is PermissionRequest {
  return PermissionRequestSchema.safeParse(data).success;
}

// Safe parsing functions with error handling
export function safeParseGrokEvent(data: unknown): z.infer<typeof GrokEventSchema> | null {
  const result = GrokEventSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeParseRawToolCall(data: unknown): RawToolCall | null {
  const result = RawToolCallSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeParseRawToolResult(data: unknown): RawToolResult | null {
  const result = RawToolResultSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function safeParsePermissionRequest(data: unknown): PermissionRequest | null {
  const result = PermissionRequestSchema.safeParse(data);
  return result.success ? result.data : null;
}
