import { FileText, Download, Copy, Globe } from 'lucide-react';

export function DocsView() {
  return (
    <div className="work-view">
      <div className="work-view-header">
        <div className="work-view-header-icon" style={{ background: 'rgba(34,197,94,.1)' }}>
          <FileText size={16} style={{ color: '#22c55e' }} />
        </div>
        <div>
          <div className="work-view-header-title">Q2-Financial-Report.pdf</div>
          <div className="work-view-header-meta">2.4 MB · 47 pages · Analyzed 2 min ago</div>
        </div>
        <span className="work-badge work-badge-green">Processed</span>
      </div>

      <div className="work-section-title">Key Insights</div>
      <div className="work-insight-list">
        <div className="work-insight-card">
          <div className="work-insight-row">
            <span className="work-insight-title">Revenue +23.7% YoY</span>
            <span className="work-badge work-badge-green">positive</span>
          </div>
          <div className="work-insight-body">
            Q2 total revenue reached ¥128.4M. SaaS subscriptions now account for 61% of total revenue,
            up from 52% in Q1 — indicating successful transition to recurring model.
          </div>
        </div>
        <div className="work-insight-card">
          <div className="work-insight-row">
            <span className="work-insight-title">Margin Compression −2.1pp</span>
            <span className="work-badge work-badge-yellow">watch</span>
          </div>
          <div className="work-insight-body">
            Operating margin declined to 18.3% due to R&amp;D headcount expansion (+34 engineers).
            Management projects recovery in H2 as new hires reach full productivity.
          </div>
        </div>
        <div className="work-insight-card">
          <div className="work-insight-row">
            <span className="work-insight-title">AI Division Breakout</span>
            <span className="work-badge work-badge-orange">highlight</span>
          </div>
          <div className="work-insight-body">
            AI services division hit ¥18.2M in Q2 (first time exceeding ¥15M). 3 enterprise contracts
            worth &gt;¥5M each were signed in June alone.
          </div>
        </div>
      </div>

      <div className="work-section-title">Extracted Action Items</div>
      <div className="work-action-list">
        <div className="work-action-item">
          <div className="work-action-dot" />
          <span>Prepare investor deck addressing margin compression — before Q3 earnings call</span>
        </div>
        <div className="work-action-item">
          <div className="work-action-dot" />
          <span>Follow up with 3 AI division clients (&gt;¥5M contracts) on Q3 renewal terms</span>
        </div>
        <div className="work-action-item done">
          <div className="work-action-check">✓</div>
          <span>Update board on SaaS transition — completed Jun 15</span>
        </div>
      </div>
    </div>
  );
}

export function DocsSidebar() {
  const docs = [
    { name: 'Q2-Financial-Report.pdf', size: '2.4 MB' },
    { name: 'Product-Spec-v3.md', size: '180 KB' },
    { name: 'Meeting-Notes-Jun24.txt', size: '42 KB' },
  ];

  return (
    <div className="work-sidebar-content">
      {docs.map((doc) => (
        <div key={doc.name} className="work-sidebar-item">
          <FileText size={13} className="text-fg5" />
          <div>
            <div className="work-sidebar-item-name">{doc.name}</div>
            <div className="work-sidebar-item-meta">{doc.size}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocsRightPane() {
  return (
    <div className="work-right-content">
      <div className="work-section-title">Document Info</div>
      <div className="work-info-card">
        <div className="work-info-row"><span>Pages</span><strong>47</strong></div>
        <div className="work-info-row"><span>Words</span><strong>14,832</strong></div>
        <div className="work-info-row"><span>Language</span><strong>Chinese</strong></div>
        <div className="work-info-row"><span>Read time</span><strong>52 min</strong></div>
      </div>
      <div className="work-section-title">Quick Actions</div>
      <div className="work-action-btn-list">
        <button className="work-action-btn"><Download size={12} /> Export PDF</button>
        <button className="work-action-btn"><Copy size={12} /> Copy Summary</button>
        <button className="work-action-btn"><Globe size={12} /> Translate</button>
      </div>
    </div>
  );
}
