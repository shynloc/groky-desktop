import { useState, useRef, useEffect } from 'react';
import { FilePlus2, FolderOpen, ListTodo, Settings, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { SUBSCRIPTION_MODELS, API_MODELS, GrokModelId } from '../constants';
import { Language, t } from '../i18n';
import grokyIcon from '../assets/icon.png';

const BADGE_STYLES: Record<string, string> = {
  coding: 'badge-blue',
  best: 'badge-orange',
  reason: 'badge-violet',
  agents: 'badge-green',
};

interface TopBarProps {
  projectPath: string | null;
  isStreaming: boolean;
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onNewSession: () => void;
  language: Language;
}

export function TopBar({ projectPath, isStreaming, onOpenFolder, onOpenSettings, onNewSession, language }: TopBarProps) {
  const T = (key: Parameters<typeof t>[1]) => t(language, key);
  const {
    model,
    setModel,
    alwaysApproveEnabled,
    toggleAlwaysApprove,
    planMode,
    togglePlanMode,
    authMode,
    dynamicModels,
  } = useAppStore();

  // Build the model list: use dynamic (from `grok models`) if available, else static fallback
  type ModelEntry = { id: string; label: string; context?: string; badge?: string | null };
  const modelList: ModelEntry[] = dynamicModels.length > 0
    ? dynamicModels
    : (authMode === 'apikey' ? (API_MODELS as readonly ModelEntry[]).slice() : (SUBSCRIPTION_MODELS as readonly ModelEntry[]).slice());
  const [modelOpen, setModelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = modelList.find((m) => m.id === model) ?? modelList[0];
  const projectName = projectPath ? projectPath.split('/').pop() || projectPath : 'No project';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectModel = (id: GrokModelId) => {
    setModel(id);
    setModelOpen(false);
  };

  return (
    <div className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark">
          <img src={grokyIcon} alt="Groky" />
        </div>
        <div>
          <div className="brand-name">Groky</div>
          <div className="brand-subtitle">by xAI</div>
        </div>
      </div>

      <button onClick={onOpenFolder} className="chrome-button open-project">
        <FolderOpen size={13} />
        <span>{T('openProject')}</span>
      </button>

      <button onClick={onNewSession} className="chrome-button session-button" title="/new">
        <FilePlus2 size={13} />
        <span>{T('newSession')}</span>
      </button>

      <div className="project-path type-mono" title={projectPath || ''}>
        {projectPath || projectName}
      </div>

      <div className="topbar-actions">
        <div ref={dropdownRef} className="relative">
          <button onClick={() => setModelOpen((o) => !o)} className="model-trigger">
            <span className="model-dot" />
            <span className="type-mono model-label">{currentModel.label}</span>
            <ChevronDown size={10} className={modelOpen ? 'rotate-180' : ''} />
          </button>

          {modelOpen && (
            <div className="model-menu">
              {modelList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectModel(m.id as GrokModelId)}
                  className={m.id === model ? 'active' : ''}
                >
                  <div className="model-copy">
                    <div className="type-mono">{m.label}</div>
                    {m.context && <span>{m.context} context</span>}
                  </div>
                  {m.badge && (
                    <span className={`model-badge ${BADGE_STYLES[m.badge] ?? ''}`}>{m.badge}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={togglePlanMode}
          className={`mode-toggle ${planMode ? 'active' : ''}`}
          title="Plan mode"
        >
          <ListTodo size={12} />
          <span>{T('plan')}</span>
        </button>

        <button
          onClick={toggleAlwaysApprove}
          className={`mode-toggle approve ${alwaysApproveEnabled ? 'active' : ''}`}
          title={alwaysApproveEnabled ? 'Always-approve' : 'Ask mode'}
        >
          <ShieldCheck size={12} />
          <span>{T('approve')}</span>
        </button>

        <button onClick={onOpenSettings} className="icon-button" title="Settings">
          <Settings size={14} />
        </button>

        {isStreaming && (
          <div className="top-streaming">
            <div className="streaming-dot" />
            <span>{T('streaming')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
