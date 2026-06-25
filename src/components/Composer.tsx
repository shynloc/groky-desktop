import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Zap, FolderOpen, Search } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { EFFORT_LEVELS, EffortLevel } from '../constants';
import { Language, t } from '../i18n';

interface ComposerProps {
  onSend: (prompt: string) => void;
  disabled?: boolean;
  projectPath: string | null;
  onOpenFolder?: () => void;
  pendingFile?: string | null;
  onPendingFileConsumed?: () => void;
  language?: Language;
}

const EFFORT_LABELS: Record<EffortLevel, string> = {
  low:    'Low',
  medium: 'Med',
  high:   'High',
  xhigh:  'X-High',
  max:    'Max',
};

export function Composer({
  onSend,
  disabled,
  projectPath,
  onOpenFolder,
  pendingFile,
  onPendingFileConsumed,
  language = 'zh',
}: ComposerProps) {
  const T = (key: Parameters<typeof t>[1]) => t(language, key);
  const [value, setValue] = useState('');
  const [effortOpen, setEffortOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { effort, setEffort } = useAppStore();

  useEffect(() => {
    if (!pendingFile) return;
    const fileRef = `@${pendingFile}`;
    setValue((prev) => {
      if (prev.includes(fileRef)) return prev;
      return prev ? `${prev} ${fileRef}` : fileRef;
    });
    textareaRef.current?.focus();
    onPendingFileConsumed?.();
  }, [pendingFile, onPendingFileConsumed]);

  // Auto-resize textarea up to max-height
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttach = async () => {
    const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';
    if (IS_TAURI && projectPath) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          directory: false,
          multiple: false,
          title: 'Attach File',
          defaultPath: projectPath,
        });
        if (selected && typeof selected === 'string') {
          const relative = selected.startsWith(projectPath + '/')
            ? selected.slice(projectPath.length + 1)
            : selected;
          const fileRef = `@${relative}`;
          setValue((prev) => (prev ? `${prev} ${fileRef}` : fileRef));
          textareaRef.current?.focus();
          return;
        }
      } catch {
        // fall through to placeholder
      }
    }
    // Browser mode fallback
    const fileExample = '@src/main.rs';
    setValue((prev) => (prev ? prev + ' ' + fileExample : fileExample));
    textareaRef.current?.focus();
  };

  const handleSelectEffort = (level: EffortLevel | null) => {
    setEffort(level);
    setEffortOpen(false);
  };

  const hasValue = value.trim().length > 0;

  if (!projectPath) {
    return (
      <div
        onClick={() => onOpenFolder?.()}
        className="composer composer-empty"
      >
        <div className="empty-open">
          <div className="empty-open-icon">
            <FolderOpen size={18} />
          </div>
          <div>
            <div>{T('openFolderToBegin')}</div>
            <span>{T('clickOrButton')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="composer">
      <div className="context-pills">
        <div className="context-pill web-search">
          <Search size={10} className="opacity-60" />
          <span>web search on</span>
        </div>
        <div
          onClick={handleAttach}
          className="context-pill add-file"
        >
          + attach file
        </div>
      </div>

      <div className="composer-box">
        <div className="composer-input-wrap">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={T('composerPlaceholder')}
            disabled={disabled}
            rows={2}
            style={{ minHeight: '68px', maxHeight: '200px' }}
          />
          <div className="composer-inline-actions">
            <button
              onClick={handleAttach}
              className="icon-button flat"
              title="Attach file (@)"
            >
              <Paperclip size={15} />
            </button>
            <button
              className="icon-button flat"
              title="Quick skills"
            >
              <Zap size={15} />
            </button>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !hasValue}
          className={`send-button ${hasValue ? 'ready' : ''}`}
        >
          <Send size={18} />
        </button>
      </div>

      <div className="composer-footer">
        <div>Grok Build <span>•</span> streaming-json</div>

        <div className="composer-shortcuts">
          <kbd>⌘K</kbd>
          <span><kbd>@</kbd> files</span>

          <div className="relative">
            <button
              onClick={() => setEffortOpen((o) => !o)}
              className={`effort-button ${effort ? 'active' : ''}`}
              title="Reasoning effort"
            >
              <Zap size={9} />
              <span>{effort ? EFFORT_LABELS[effort] : T('effortLabel')}</span>
            </button>

            {effortOpen && (
              <div className="effort-menu">
                <button
                  onClick={() => handleSelectEffort(null)}
                  className={!effort ? 'active' : ''}
                >
                  Default
                </button>
                {EFFORT_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSelectEffort(lvl)}
                    className={effort === lvl ? 'active' : ''}
                  >
                    {EFFORT_LABELS[lvl]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
