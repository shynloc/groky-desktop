import { Search, FileText } from 'lucide-react';

const results = [
  { domain: 'arxiv.org', date: 'Jun 2026', title: 'Grok 4 vs Claude 3.5: Comprehensive Benchmark Analysis', snippet: 'Our evaluation shows Grok 4 achieves 94.2% on HumanEval, surpassing Claude 3.5\'s 92.1%. In multi-turn reasoning tasks, Grok 4 maintains context coherence over 200k tokens...' },
  { domain: 'techcrunch.com', date: 'May 2026', title: 'xAI Launches Grok Build CLI for Developers', snippet: 'xAI has officially released Grok Build, a command-line coding agent powered by the grok-build-0.1 model. The tool supports MCP servers, skills, and 1M context windows...' },
  { domain: 'openai.com/research', date: 'Apr 2026', title: 'GPT-4o System Card Update', snippet: 'Updated benchmark results for GPT-4o across coding, reasoning, and multimodal tasks. GPT-4o scores 91.8% on HumanEval with a 128k context window...' },
  { domain: 'docs.x.ai', date: 'Jun 2026', title: 'xAI API Rate Limits and Pricing Guide 2026', snippet: 'Standard tier: 60 RPM / 100k TPM. Pro tier: 300 RPM / 500k TPM. Enterprise: custom limits. Grok Build model pricing at $3/M input tokens, $15/M output tokens...' },
];

export function ResearchView() {
  return (
    <div className="work-view">
      <div className="work-research-query">
        <Search size={13} className="text-fg5" />
        <span>Grok 4 vs Claude 3.5 benchmark comparison 2026</span>
        <span className="work-badge work-badge-green">4 sources</span>
      </div>

      <div className="work-section-title">Sources</div>
      <div className="work-research-list">
        {results.map((res) => (
          <div key={res.domain} className="work-research-card">
            <div className="work-research-card-header">
              <span className="work-research-domain">{res.domain}</span>
              <span className="work-research-date">{res.date}</span>
            </div>
            <div className="work-research-title">{res.title}</div>
            <div className="work-research-snippet">{res.snippet}</div>
          </div>
        ))}
      </div>

      <button className="work-btn-report">
        <FileText size={13} />
        Generate Comprehensive Report
      </button>
    </div>
  );
}

export function ResearchSidebar() {
  const searches = [
    'Grok 4 vs Claude 3.5 benchmark comparison 2026',
    'Best AI coding tools for enterprise 2026',
    'xAI API rate limits and quotas',
    'Grok Build skills ecosystem overview',
  ];

  return (
    <div className="work-sidebar-content">
      <div className="work-section-title muted">Recent</div>
      {searches.map((q) => (
        <div key={q} className="work-sidebar-search-item">{q}</div>
      ))}
    </div>
  );
}

export function ResearchRightPane() {
  return (
    <div className="work-right-content">
      <div className="work-section-title">Report</div>
      <div className="work-info-card">
        <div className="work-report-header">
          <FileText size={13} className="text-accent" />
          <span>Research Report</span>
        </div>
        <div className="work-report-meta">4 sources · ~2,800 words</div>
        <div className="work-progress-bar">
          <div className="work-progress-fill accent" style={{ width: '0%' }} />
        </div>
        <button className="work-btn-accent full">Generate Report</button>
      </div>
      <div className="work-section-title">Related Queries</div>
      <div className="work-related-list">
        <div className="work-related-item">Grok 4 vs GPT-4o pricing comparison</div>
        <div className="work-related-item">Best AI coding tools for enterprise 2026</div>
        <div className="work-related-item">xAI API rate limits and quotas</div>
      </div>
    </div>
  );
}
