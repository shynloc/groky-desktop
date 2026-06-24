import { Brain, Code, Zap, FolderOpen } from 'lucide-react';

interface WelcomeScreenProps {
  onOpenFolder: () => void;
  onStartChat: () => void;
}

export function WelcomeScreen({ onOpenFolder, onStartChat }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        {/* Logo and title */}
        <div className="welcome-header">
          <div className="welcome-logo">
            <Brain size={32} />
          </div>
          <div className="welcome-title">Groky</div>
          <div className="welcome-subtitle">Native GUI for Grok Build · by xAI</div>
        </div>

        {/* Feature cards */}
        <div className="welcome-features">
          <div className="welcome-feature-card">
            <div className="welcome-feature-icon" style={{ background: 'rgba(59, 130, 246, 0.12)' }}>
              <Brain size={15} style={{ color: '#3b82f6' }} />
            </div>
            <div className="welcome-feature-title">GrokWork</div>
            <div className="welcome-feature-desc">Chat · Docs · Image · Voice · Projects · Research</div>
          </div>
          <div className="welcome-feature-card">
            <div className="welcome-feature-icon" style={{ background: 'rgba(249, 115, 22, 0.12)' }}>
              <Code size={15} style={{ color: '#f97316' }} />
            </div>
            <div className="welcome-feature-title">GrokBuild</div>
            <div className="welcome-feature-desc">Streaming agent · Diff viewer · Permissions</div>
          </div>
          <div className="welcome-feature-card">
            <div className="welcome-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.12)' }}>
              <Zap size={15} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="welcome-feature-title">1M Context</div>
            <div className="welcome-feature-desc">Projects · Sessions · Files always in scope</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="welcome-actions">
          <button className="welcome-btn-primary" onClick={onOpenFolder}>
            <FolderOpen size={16} />
            Open Project
          </button>
          <button className="welcome-btn-secondary" onClick={onStartChat}>
            Start Chatting
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="welcome-shortcut">
          <kbd>⌘K</kbd>
          <span>to open command palette</span>
        </div>
      </div>
    </div>
  );
}
