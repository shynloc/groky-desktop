import { ChatMessage } from '../types';

/**
 * Rough token estimation: ~4 chars per token for ASCII, ~2 chars per CJK character.
 * This is a fast heuristic — not exact BPE, but good enough for UI warnings.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // CJK Unified Ideographs + common CJK ranges
    if (code >= 0x4e00 && code <= 0x9fff) {
      count += 0.5; // ~2 chars per token
    } else {
      count += 0.25; // ~4 chars per token
    }
  }
  return Math.ceil(count);
}

/**
 * Estimate total token count for a list of chat messages.
 */
export function estimateMessageTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    // Role overhead (~4 tokens per message)
    total += 4;
    if (msg.content) total += estimateTokens(msg.content);
    if (msg.thinking) total += estimateTokens(msg.thinking);
    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        if (tc.input) total += estimateTokens(tc.input);
        if (tc.output) total += estimateTokens(tc.output);
      }
    }
    if (msg.todos) {
      for (const todo of msg.todos) {
        total += estimateTokens(todo.content) + 4; // checkbox + status overhead
      }
    }
  }
  return total;
}
