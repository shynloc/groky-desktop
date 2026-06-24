import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  language?: Language;
}

export function ChatPane({ messages, isStreaming, onOpenFolder, language = 'zh' }: ChatPaneProps) {
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
