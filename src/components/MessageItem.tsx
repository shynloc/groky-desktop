import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { ChatMessage } from '../types';
import { ToolCard } from './ToolCard';
import grokyAvatar from '../assets/icon.png';

interface MessageItemProps {
  message: ChatMessage;
  isLast?: boolean;
}

// Custom Markdown component map — styled to match the dark theme
const mdComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="text-base font-semibold mt-3 mb-1 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-semibold mt-2 mb-0.5 text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5 text-white/90">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0">{children}</ol>,
  li: ({ children }) => <li className="text-white/90 leading-snug">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-orange-400 underline underline-offset-2 hover:text-orange-300">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-white/20 pl-3 my-2 text-white/60 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-white/10 my-3" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="text-[12.5px] border-collapse w-full">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-white/15">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-1.5 text-left font-semibold text-white/70 uppercase text-[10.5px]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-1.5 border-b border-white/8 text-white/80">{children}</td>
  ),
  // Inline code
  code: ({ className, children }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      const lang = className?.replace('language-', '') ?? '';
      return (
        <div className="relative my-3 rounded-md overflow-hidden border border-white/10">
          {lang && (
            <div className="px-3 py-1 bg-white/5 text-[10px] font-mono text-white/40 border-b border-white/10">
              {lang}
            </div>
          )}
          <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed bg-black/30">
            <code className="font-mono text-white/88">{children}</code>
          </pre>
        </div>
      );
    }
    return (
      <code className="font-mono text-[0.88em] bg-white/8 text-orange-300/90 px-1.5 py-0.5 rounded border border-white/10">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
};

export function MessageItem({ message }: MessageItemProps) {
  const [thinkingOpen, setThinkingOpen] = useState(false);

  const isUser   = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="system-message-row">
        <div className="system-message type-mono">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`message-row ${isUser ? 'user-row' : ''}`}>
      <div className={isUser ? 'max-w-[72%]' : 'max-w-[82%] w-full'}>
        {isUser ? (
          <div className="message-bubble user-bubble">
            {message.content}
          </div>
        ) : (
          <div>
            <div className="message-header flex items-center gap-2 mb-2">
              <img src={grokyAvatar} alt="Groky" style={{ width: 18, height: 18, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
              <span>GROKY</span>
              {message.isStreaming && <span className="streaming-label">STREAMING</span>}
            </div>

            {/* Collapsible thinking block */}
            {message.thinking && (
              <div className="thinking-block mb-3">
                <button
                  onClick={() => setThinkingOpen((o) => !o)}
                  className="thinking-toggle"
                >
                  {thinkingOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Brain size={11} />
                  THOUGHT PROCESS
                  <span className="text-white/20">
                    ({Math.round(message.thinking.length / 4)} tokens est.)
                  </span>
                </button>

                {thinkingOpen && (
                  <div className="thinking-content type-mono">
                    {message.thinking}
                  </div>
                )}
              </div>
            )}

            {/* Tool calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {message.toolCalls.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}

            {/* Main content — rendered as Markdown */}
            {message.content && (
              <div className="message-content text-[13.5px] leading-[1.5] text-white/92">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
