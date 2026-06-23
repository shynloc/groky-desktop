import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Brain } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { ChatMessage } from '../types';
import { Language, t } from '../i18n';

// Re-export so existing imports from ChatPane continue to work during migration.
export type { ChatMessage };

interface ChatPaneProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onOpenFolder?: () => void;
  language?: Language;
}

export function ChatPane({ messages, isStreaming, onOpenFolder, language = 'zh' }: ChatPaneProps) {
  const T = (key: Parameters<typeof t>[1]) => t(language, key);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom when new content arrives
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="empty-chat">
        <div className="empty-chat-inner">
          <div className="empty-chat-icon">
            <Brain size={28} />
          </div>
          <div className="empty-title">{T('readyToBuild')}</div>
          <p>
            {T('readyDesc')}<br />
            {T('readyExample') && (
              <span className="type-mono text-accent">{T('readyExample')}</span>
            )}
          </p>

          <button
            onClick={() => onOpenFolder?.()}
            className="primary-action"
          >
            <FolderOpen size={16} />
            {T('openProjectFolder')}
          </button>

          <div className="empty-caption">
            {T('dragFolder')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      <AnimatePresence initial={false}>
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            <MessageItem message={msg} isLast={index === messages.length - 1} />
          </motion.div>
        ))}
      </AnimatePresence>

      {isStreaming && (
        <div className="streaming-indicator ml-1">
          <div className="streaming-dot" />
          <span>Groky {T('streaming')}…</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
