import {
  Moon,
  Code,
  Settings,
  MessageSquare,
  FileText,
  Image,
  Mic,
  FolderKanban,
  Search,
} from 'lucide-react';
import { Language, t } from '../i18n';

export type AppMode = 'work' | 'build';
export type WorkView = 'chat' | 'docs' | 'image' | 'voice' | 'projects' | 'research';

interface IconDockProps {
  mode: AppMode;
  workView: WorkView;
  onModeChange: (mode: AppMode) => void;
  onWorkViewChange: (view: WorkView) => void;
  onOpenSettings: () => void;
  language?: Language;
}

const workViews: { view: WorkView; icon: typeof MessageSquare; title: string }[] = [
  { view: 'chat', icon: MessageSquare, title: 'Chat' },
  { view: 'docs', icon: FileText, title: 'Docs' },
  { view: 'image', icon: Image, title: 'Image' },
  { view: 'voice', icon: Mic, title: 'Voice' },
  { view: 'projects', icon: FolderKanban, title: 'Projects' },
  { view: 'research', icon: Search, title: 'Research' },
];

export function IconDock({
  mode,
  workView,
  onModeChange,
  onWorkViewChange,
  onOpenSettings,
  language = 'zh',
}: IconDockProps) {
  const T = (key: Parameters<typeof t>[1]) => t(language, key);

  return (
    <div className="icon-dock">
      {/* GrokWork button */}
      <button
        className={`icon-dock-btn ${mode === 'work' ? 'active' : ''}`}
        onClick={() => onModeChange('work')}
        title="GrokWork"
      >
        <Moon size={16} />
      </button>

      {/* GrokBuild button */}
      <button
        className={`icon-dock-btn ${mode === 'build' ? 'active' : ''}`}
        onClick={() => onModeChange('build')}
        title="GrokBuild"
      >
        <Code size={16} />
      </button>

      <div className="icon-dock-divider" />

      {/* Work view icons (only shown in work mode) */}
      {mode === 'work' &&
        workViews.map(({ view, icon: Icon, title }) => (
          <button
            key={view}
            className={`icon-dock-btn ${workView === view ? 'active' : ''}`}
            onClick={() => onWorkViewChange(view)}
            title={title}
          >
            <Icon size={15} />
          </button>
        ))}

      {/* Spacer */}
      <div className="icon-dock-spacer" />

      {/* Settings */}
      <button
        className="icon-dock-btn"
        onClick={onOpenSettings}
        title={T('tabSettings')}
      >
        <Settings size={15} />
      </button>
    </div>
  );
}
