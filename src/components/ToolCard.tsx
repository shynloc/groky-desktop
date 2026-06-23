import { Search, FileText, Terminal, Edit3, Globe } from 'lucide-react';
import { ToolCall } from '../types';

interface ToolCardProps {
  tool: ToolCall;
}

const toolIcons: Record<string, any> = {
  read_file: FileText,
  search_replace: Edit3,
  grep: Search,
  run_terminal_command: Terminal,
  web_search: Globe,
  web_fetch: Globe,
  list_dir: FileText,
};

export function ToolCard({ tool }: ToolCardProps) {
  const toolName = tool.tool;
  const status = tool.status;

  const Icon = toolIcons[toolName] || FileText;
  const isEdit = toolName.includes('replace') || toolName.includes('write') || toolName.includes('edit');

  const statusClass = `status-${status}`;

  return (
    <div className={`tool-card group ${statusClass}`}>
      <div className="tool-card-main">
        <div className="tool-title">
          <div className="tool-icon">
            <Icon size={14} />
          </div>
          <span className="type-mono">{toolName}</span>
        </div>
        <span className={`tool-status ${statusClass}`}>
          {status}
        </span>
      </div>

      {tool.filePath && (
        <div className="tool-path type-mono">
          <FileText size={10} /> {tool.filePath}
        </div>
      )}

      {tool.input && (
        <div className="tool-input type-mono">
          {tool.input.slice(0, 180)}{tool.input.length > 180 ? '…' : ''}
        </div>
      )}

      {isEdit && tool.output && (
        <div className="tool-review">
          <Edit3 size={12} /> Changes proposed - review in Diff tab
        </div>
      )}
    </div>
  );
}
