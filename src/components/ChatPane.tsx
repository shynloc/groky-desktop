import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List } from 'react-window';
import { MessageItem } from './MessageItem';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatMessage } from '../types';
import { Language, t } from '../i18n';

// Re-export so existing imports from ChatPane continue to work during migration.
export type { ChatMessage };

interface ChatPaneProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onOpenFolder?: () => void;
  onResend?: (prompt: string) => void;
  language?: Language;
}

// Virtualized message row component
function VirtualMessageRow({
  data,
  index,
  style,
}: {
  data: { messages: ChatMessage[]; onResend?: (prompt: string) => void };
  index: number;
  style: React.CSSProperties;
}) {
  const msg = data.messages[index];
  return (
    <div style={style}>
      <MessageItem message={msg} isLast={index === data.messages.length - 1} onResend={data.onResend} />
    </div>
  );
}

export function ChatPane({ messages, isStreaming, onOpenFolder, onResend, language = 'zh' }: ChatPaneProps) {
  const T = (key: Parameters<typeof t>[1]) => t(language, key);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Check if user is near bottom
  const checkIfNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    
    const threshold = 100; // pixels from bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Scroll to bottom with requestAnimationFrame throttling
  const scrollToBottom = useCallback(() => {
    if (!isNearBottomRef.current) return;
    
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  // Update near-bottom status on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isNearBottomRef.current = checkIfNearBottom();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfNearBottom]);

  // Auto scroll when new content arrives (only if near bottom)
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  // Use virtualization for large message lists
  const useVirtualization = messages.length > 50;

  if (messages.length === 0) {
    return (
      <WelcomeScreen
        onOpenFolder={() => onOpenFolder?.()}
        onStartChat={() => {
          // Focus on the composer input
          const composer = document.querySelector('.composer textarea') as HTMLTextAreaElement;
          composer?.focus();
        }}
      />
    );
  }

  // Virtualized rendering for large message lists
  if (useVirtualization) {
    return (
      <div ref={containerRef} className="message-list">
        <List
          defaultHeight={600}
          rowCount={messages.length}
          rowHeight={100}
          rowComponent={({ index, style, ...props }) => (
            <VirtualMessageRow
              index={index}
              style={style}
              data={{ messages, onResend }}
              {...props}
            />
          )}
          rowProps={{}}
        />
        {isStreaming && (
          <div className="streaming-indicator ml-1">
            <div className="streaming-dots">
              <span className="streaming-dot" />
              <span className="streaming-dot" />
              <span className="streaming-dot" />
            </div>
            <span>Groky {T('streaming')}…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    );
  }

  // Standard rendering for small message lists
  return (
    <div ref={containerRef} className="message-list">
      <AnimatePresence initial={false}>
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            <MessageItem message={msg} isLast={index === messages.length - 1} onResend={onResend} />
          </motion.div>
        ))}
      </AnimatePresence>

      {isStreaming && (
        <div className="streaming-indicator ml-1">
          <div className="streaming-dots">
            <span className="streaming-dot" />
            <span className="streaming-dot" />
            <span className="streaming-dot" />
          </div>
          <span>Groky {T('streaming')}…</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
