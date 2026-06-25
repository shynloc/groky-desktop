import { useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Shield, ShieldCheck, ShieldOff, ShieldAlert, Zap } from 'lucide-react';
import { ApprovalRequest } from '../types';
import { MAX_APPROVAL_PREVIEW_LENGTH, DANGEROUS_COMMAND_PATTERNS } from '../constants/config';

interface ApprovalModalProps {
  request: ApprovalRequest;
  onResolve: (action: 'once' | 'session' | 'deny') => void;
}

// Pre-compile the regex pattern for better performance
const DANGEROUS_REGEX = new RegExp(DANGEROUS_COMMAND_PATTERNS.join('|'), 'i');

export function ApprovalModal({ request, onResolve }: ApprovalModalProps) {
  const isDangerous = useMemo(() => {
    const text = [request.command, request.input].filter(Boolean).join(' ');
    return DANGEROUS_REGEX.test(text);
  }, [request.command, request.input]);

  const handleResponse = async (action: 'once' | 'session' | 'deny') => {
    const approved = action !== 'deny';
    try {
      await invoke('reply_to_grok', { response: approved ? 'y' : 'n' });
    } catch {
      // stdin write may fail if grok already decided; ignore
    }
    onResolve(action);
  };

  const preview = request.command ?? request.input ?? request.description;

  return (
    <div className="approval-overlay">
      <div className="approval-modal">
        <div className="approval-header">
          <ShieldAlert size={16} className={isDangerous ? 'text-danger' : 'text-accent'} />
          <span>Permission Request</span>
        </div>

        <div className="approval-tool-row">
          <div className={`approval-tool-icon ${isDangerous ? 'danger' : ''}`}>
            <Shield size={13} />
          </div>
          <span className="type-mono">{request.tool}</span>
          {isDangerous && <span className="approval-danger-badge">DANGEROUS</span>}
        </div>

        {request.filePath && (
          <div className="approval-detail">
            <div className="approval-detail-label">File</div>
            <div className="approval-detail-value type-mono">{request.filePath}</div>
          </div>
        )}

        {preview && (
          <div className="approval-detail">
            <div className="approval-detail-label">
              {request.command ? 'Command' : 'Details'}
            </div>
            <pre className="approval-detail-value">{preview.slice(0, MAX_APPROVAL_PREVIEW_LENGTH)}</pre>
          </div>
        )}

        <div className="approval-actions">
          <button onClick={() => handleResponse('once')} className="approval-btn allow-once">
            <Shield size={12} />
            Allow once
            <span className="approval-btn-hint">This command only</span>
          </button>
          <button onClick={() => handleResponse('session')} className="approval-btn allow-session">
            <Zap size={12} />
            Allow in session
            <span className="approval-btn-hint">This conversation</span>
          </button>
          <button onClick={() => handleResponse('session')} className="approval-btn always">
            <ShieldCheck size={12} />
            Always allow
            <span className="approval-btn-hint">All future runs</span>
          </button>
          <button onClick={() => handleResponse('deny')} className="approval-btn deny">
            <ShieldOff size={12} />
            Deny
            <span className="approval-btn-hint">Skip this call</span>
          </button>
        </div>

        <div className="approval-hint">
          Groky is about to execute <strong>{request.tool}</strong>.
          Allow Once runs it now. Allow Session skips prompts for this tool until restart.
        </div>
      </div>
    </div>
  );
}
