import { useState, lazy, Suspense } from 'react';
import { Check, X, FileEdit, GitBranch, CheckCheck, XCircle, Columns, AlignLeft } from 'lucide-react';
import { PendingDiff } from '../types';

const MonacoDiffEditor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.DiffEditor })));

interface DiffViewProps {
  diffs: PendingDiff[];
  onApply: (id: string) => void;
  onReject: (id: string) => void;
  onApplyAll?: () => void;
  onRejectAll?: () => void;
}

export function DiffView({ diffs, onApply, onReject, onApplyAll, onRejectAll }: DiffViewProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified' | 'monaco'>('unified');

  if (diffs.length === 0) {
    return (
      <div className="diff-empty">
        <FileEdit size={22} />
        <p>Diff preview appears here when Groky proposes file edits.</p>
      </div>
    );
  }

  const pendingDiffs = diffs.filter((d) => d.status === 'pending');
  const pendingCount = pendingDiffs.length;

  return (
    <div className="diff-list">
      {pendingCount > 0 && (
        <div className="diff-summary">
          <div className="diff-summary-left">
            <GitBranch size={11} />
            <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="diff-summary-actions">
            <div className="diff-view-toggle">
              <button
                className={`diff-view-btn ${viewMode === 'unified' ? 'active' : ''}`}
                onClick={() => setViewMode('unified')}
                title="Unified view"
              >
                <AlignLeft size={11} />
              </button>
              <button
                className={`diff-view-btn ${viewMode === 'monaco' ? 'active' : ''}`}
                onClick={() => setViewMode('monaco')}
                title="Monaco side-by-side"
              >
                <Columns size={11} />
              </button>
            </div>
            {onApplyAll && (
              <button onClick={onApplyAll} className="diff-batch-btn apply-all">
                <CheckCheck size={12} />
                Apply All
              </button>
            )}
            {onRejectAll && (
              <button onClick={onRejectAll} className="diff-batch-btn reject-all">
                <XCircle size={12} />
                Dismiss All
              </button>
            )}
          </div>
        </div>
      )}
      {diffs.map((diff) => (
        <DiffItem key={diff.id} diff={diff} onApply={onApply} onReject={onReject} viewMode={viewMode} />
      ))}
    </div>
  );
}

function DiffItem({
  diff,
  onApply,
  onReject,
  viewMode,
}: {
  diff: PendingDiff;
  onApply: (id: string) => void;
  onReject: (id: string) => void;
  viewMode: 'split' | 'unified' | 'monaco';
}) {
  const oldLines = diff.oldStr ? diff.oldStr.split('\n') : [];
  const newLines = diff.newStr ? diff.newStr.split('\n') : [];
  const isPending = diff.status === 'pending';

  // Detect language from file extension
  const ext = diff.filePath.split('.').pop() ?? '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go', json: 'json', md: 'markdown',
    css: 'css', html: 'html', sh: 'shell', yml: 'yaml', yaml: 'yaml',
    toml: 'toml', rb: 'ruby', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
  };
  const language = langMap[ext] ?? 'plaintext';

  return (
    <div className={`diff-item ${diff.status}`}>
      <div className="diff-toolbar">
        <div>
          <div className="type-mono diff-file">{diff.filePath}</div>
          <div className="diff-stats">
            {oldLines.length > 0 && (
              <span className="minus">-{oldLines.length}</span>
            )}
            {newLines.length > 0 && (
              <span className="plus">+{newLines.length}</span>
            )}
          </div>
        </div>
        {isPending ? (
          <div className="diff-actions">
            <button onClick={() => onApply(diff.id)} className="apply">
              <Check size={12} />
              Accept
            </button>
            <button onClick={() => onReject(diff.id)} className="reject">
              <X size={12} />
              Dismiss
            </button>
          </div>
        ) : (
          <span className={`diff-resolved-badge ${diff.status}`}>
            {diff.status}
          </span>
        )}
      </div>

      {viewMode === 'monaco' ? (
        <div className="diff-monaco-container">
          <Suspense fallback={<div className="diff-monaco-loading">Loading editor…</div>}>
            <MonacoDiffEditor
              original={diff.oldStr}
              modified={diff.newStr}
              language={language}
              theme="vs-dark"
              options={{
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
              }}
              height="200px"
            />
          </Suspense>
        </div>
      ) : (
        <div className="diff-code">
          {oldLines.map((line, i) => (
            <div key={`old-${i}`} className="diff-line removed">
              <span className="diff-linenum">{i + 1}</span>
              <span className="diff-gutter">-</span>
              <span className="diff-content">{line || ' '}</span>
            </div>
          ))}
          {newLines.map((line, i) => (
            <div key={`new-${i}`} className="diff-line added">
              <span className="diff-linenum" />
              <span className="diff-gutter">+</span>
              <span className="diff-content">{line || ' '}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
