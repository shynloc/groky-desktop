import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FolderOpen, Plus, Settings } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery) ||
        cmd.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))
    );
  }, [commands, query]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="command-palette-search">
          <Search size={14} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command..."
            className="command-palette-input"
          />
          <kbd className="command-palette-kbd">esc</kbd>
        </div>

        {/* Command list */}
        <div ref={listRef} className="command-palette-list">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">No commands found</div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  className={`command-palette-item ${index === selectedIndex ? 'active' : ''}`}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Icon size={14} className="command-palette-item-icon" />
                  <div className="command-palette-item-content">
                    <span className="command-palette-item-label">{cmd.label}</span>
                    {cmd.description && (
                      <span className="command-palette-item-desc">{cmd.description}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to create default commands
export function createDefaultCommands(handlers: {
  onOpenFolder: () => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
}): Command[] {
  return [
    {
      id: 'open-folder',
      label: 'Open Project Folder',
      description: 'Open a folder to start working',
      icon: FolderOpen,
      action: handlers.onOpenFolder,
      keywords: ['open', 'folder', 'project'],
    },
    {
      id: 'new-session',
      label: 'New Session',
      description: 'Start a new chat session',
      icon: Plus,
      action: handlers.onNewSession,
      keywords: ['new', 'session', 'chat'],
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      description: 'Configure Groky preferences',
      icon: Settings,
      action: handlers.onOpenSettings,
      keywords: ['settings', 'preferences', 'config'],
    },
  ];
}
