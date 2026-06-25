import { Play, Mic } from 'lucide-react';

const speakers = [
  { name: 'Alex', pct: 42, color: '#f97316' },
  { name: 'Sarah', pct: 31, color: '#3b82f6' },
  { name: 'David', pct: 27, color: '#22c55e' },
];

const transcript = [
  { initials: 'AK', name: 'Alex', time: '0:12', text: 'The streaming pipeline is now complete and running in production. We processed 2.3M events yesterday with 99.7% uptime.', avatarBg: 'rgba(249,115,22,.15)', avatarColor: '#f97316' },
  { initials: 'SH', name: 'Sarah', time: '2:45', text: 'Great progress on the diff viewer. We should have the timeline feature ready for demo by Wednesday.', avatarBg: 'rgba(59,130,246,.15)', avatarColor: '#3b82f6' },
  { initials: 'DL', name: 'David', time: '5:18', text: 'Image module is on track for Friday. The only blocker is the binary file edge case in the diff engine — I\'ll resolve it before end of week.', avatarBg: 'rgba(34,197,94,.15)', avatarColor: '#22c55e' },
];

export function VoiceView() {
  return (
    <div className="work-view work-voice">
      <div className="work-voice-player">
        <div className="work-voice-controls">
          <button className="work-voice-play"><Play size={11} /></button>
          <span className="work-voice-time">12:18</span>
          <div className="work-voice-waveform">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="work-waveform-bar" style={{ height: `${8 + Math.sin(i * 0.7) * 14}px`, background: i < 27 ? '#f97316' : '#1e1e1e' }} />
            ))}
          </div>
          <span className="work-voice-time">18:23</span>
        </div>
        <div className="work-voice-track">
          <div className="work-voice-progress" style={{ width: '67%' }} />
        </div>
        <div className="work-voice-meta">
          <span>Team Standup · Jun 24</span>
          <div className="work-voice-tags">
            <span className="work-tag">EN</span>
            <span className="work-tag">中文</span>
            <span className="work-tag accent">Summarized</span>
          </div>
        </div>
      </div>

      <div className="work-transcript">
        {transcript.map((line) => (
          <div key={line.initials} className="work-transcript-line">
            <div className="work-transcript-avatar-col">
              <div className="work-transcript-avatar" style={{ background: line.avatarBg, color: line.avatarColor }}>{line.initials}</div>
              <div className="work-transcript-time">{line.time}</div>
            </div>
            <div>
              <div className="work-transcript-name">{line.name}</div>
              <div className="work-transcript-text">{line.text}</div>
            </div>
          </div>
        ))}

        <div className="work-ai-summary">
          <div className="work-ai-summary-header">
            <Mic size={12} className="text-accent" />
            <span>Groky Summary</span>
          </div>
          <p>3 topics covered: streaming pipeline status (complete), Diff Viewer timeline (2 days), Image module progress (Friday demo). Key blocker: binary file edge case in diff engine. Action item: David to resolve before end of week.</p>
        </div>
      </div>
    </div>
  );
}

export function VoiceSidebar() {
  const recs = [
    { name: 'Team Standup · Jun 24', dur: '18:23', color: '#22c55e' },
    { name: 'Client Call · Jun 23', dur: '42:10', color: '#3b82f6' },
    { name: 'Sprint Review · Jun 21', dur: '55:08', color: '#f97316' },
  ];

  return (
    <div className="work-sidebar-content">
      {recs.map((rec) => (
        <div key={rec.name} className="work-sidebar-item">
          <div className="work-sidebar-dot" style={{ background: rec.color }} />
          <div>
            <div className="work-sidebar-item-name">{rec.name}</div>
            <div className="work-sidebar-item-meta">{rec.dur}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function VoiceRightPane() {
  const actions = [
    'David: resolve binary file diff edge case before EOW',
    'Sarah: prepare diff viewer timeline demo for Wednesday',
    'Alex: monitor streaming pipeline uptime metrics',
  ];

  return (
    <div className="work-right-content">
      <div className="work-section-title">Action Items</div>
      <div className="work-action-list">
        {actions.map((a) => (
          <div key={a} className="work-action-item">
            <div className="work-action-dot" />
            <span>{a}</span>
          </div>
        ))}
      </div>
      <div className="work-section-title">Speaking Time</div>
      {speakers.map((sp) => (
        <div key={sp.name} className="work-speaker-row">
          <div className="work-speaker-label"><span>{sp.name}</span><span>{sp.pct}%</span></div>
          <div className="work-speaker-bar"><div style={{ width: `${sp.pct}%`, background: sp.color }} /></div>
        </div>
      ))}
    </div>
  );
}
