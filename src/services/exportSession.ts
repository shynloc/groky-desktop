import { ChatMessage } from '../types';

/**
 * Export chat messages as a Markdown string.
 */
export function messagesToMarkdown(messages: ChatMessage[], projectName?: string): string {
  const lines: string[] = [];
  const now = new Date().toLocaleString();

  lines.push(`# Groky Session Export`);
  lines.push('');
  lines.push(`**Project**: ${projectName ?? 'Unknown'}`);
  lines.push(`**Exported**: ${now}`);
  lines.push(`**Messages**: ${messages.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const msg of messages) {
    if (msg.role === 'system') {
      lines.push(`> **System**: ${msg.content}`);
      lines.push('');
      continue;
    }

    if (msg.role === 'user') {
      lines.push(`## User`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');
      continue;
    }

    // Assistant
    lines.push(`## Groky`);
    lines.push('');

    if (msg.thinking) {
      lines.push('<details>');
      lines.push('<summary>Thinking</summary>');
      lines.push('');
      lines.push(msg.thinking);
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }

    if (msg.toolCalls && msg.toolCalls.length > 0) {
      for (const tc of msg.toolCalls) {
        lines.push(`### Tool: \`${tc.tool}\``);
        if (tc.filePath) {
          lines.push(`**File**: \`${tc.filePath}\``);
        }
        lines.push(`**Status**: ${tc.status}`);
        if (tc.input) {
          lines.push('');
          lines.push('**Input**:');
          lines.push('```');
          lines.push(tc.input);
          lines.push('```');
        }
        if (tc.output) {
          lines.push('');
          lines.push('**Output**:');
          lines.push('```');
          lines.push(tc.output);
          lines.push('```');
        }
        lines.push('');
      }
    }

    if (msg.todos && msg.todos.length > 0) {
      lines.push('### Tasks');
      lines.push('');
      for (const todo of msg.todos) {
        const check = todo.status === 'completed' ? 'x' : ' ';
        lines.push(`- [${check}] ${todo.content}`);
      }
      lines.push('');
    }

    if (msg.content) {
      lines.push(msg.content);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Trigger a file download in the browser.
 */
export function downloadMarkdown(content: string, filename?: string): void {
  const name = filename ?? `groky-session-${new Date().toISOString().slice(0, 10)}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
