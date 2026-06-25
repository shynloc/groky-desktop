import { Check, X, FileEdit, GitBranch } from 'lucide-react';
import { PendingDiff } from '../types';

interface DiffViewProps {
  diffs: PendingDiff[];
  onApply: (id: string) => void;
  onReject: (id: string) => void;
}

export function DiffView({ diffs, onApply, onReject }: DiffViewProps) {
  if (diffs.length === 0) {
    return (
      <div className="diff-empty">
        <FileEdit size={22} />
        <p>Diff preview appears here when Groky proposes file edits.</p>
      </div>
    );
  }

  const pendingCount = diffs.filter((d) => d.status === 'pending').length;

  return (
    <div className="diff-list">
      {pendingCount > 0 && (
        <div className="diff-summary">
          <GitBranch size={11} />
          <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</span>
        </div>
      )}
      {diffs.map((diff) => (
        <DiffItem key={diff.id} diff={diff} onApply={onApply} onReject={onReject} />
      ))}
    </div>
  );
}

function DiffItem({
  diff,
  onApply,
  onReject,
}: {
  diff: PendingDiff;
  onApply: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const oldLines = diff.oldStr ? diff.oldStr.split('\n') : [];
  const newLines = diff.newStr ? diff.newStr.split('\n') : [];
  const isPending = diff.status === 'pending';

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
    </div>
  );
}
