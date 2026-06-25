interface StatusBarProps {
  mode: string;
  permission: string;
  tokenCount?: number;
  contextLimit?: number;
  onCompact?: () => void;
  grokVersion?: string;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function StatusBar({ mode, permission, tokenCount, contextLimit = 256000, onCompact, grokVersion }: StatusBarProps) {
  const usage = tokenCount != null && tokenCount > 0
    ? Math.min(tokenCount / contextLimit, 1)
    : 0;
  const isHigh = usage > 0.75;
  const isCritical = usage > 0.9;

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-dot active" />
        <span>{mode}</span>
      </div>
      <div className="status-bar-right">
        {tokenCount != null && tokenCount > 0 && (
          <span className={`status-tokens ${isCritical ? 'critical' : isHigh ? 'high' : ''}`}>
            {formatTokens(tokenCount)} / {formatTokens(contextLimit)}
            {isHigh && onCompact && (
              <button className="status-compact-btn" onClick={onCompact}>
                Compact
              </button>
            )}
          </span>
        )}
        <span>{permission}</span>
        {grokVersion && <span className="type-mono">{grokVersion}</span>}
      </div>
    </div>
  );
}
