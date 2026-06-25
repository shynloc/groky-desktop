import { Image as ImageIcon, RefreshCw } from 'lucide-react';

export function ImageView() {
  return (
    <div className="work-view">
      <div className="work-image-prompt-bar">
        <ImageIcon size={13} className="text-fg5" />
        <span className="work-image-prompt-text">Futuristic city skyline at dusk, neon lights reflected in rain</span>
        <button className="work-btn-ghost">↺ Vary</button>
      </div>

      <div className="work-image-controls">
        <div className="work-image-control"><span>Style</span><strong>Photorealistic</strong></div>
        <div className="work-image-control"><span>Ratio</span><strong>1 : 1</strong></div>
        <div className="work-image-control"><span>Count</span><strong>4</strong></div>
      </div>

      <div className="work-image-grid">
        <div className="work-image-cell done">
          <div className="work-image-placeholder" style={{ background: 'linear-gradient(180deg,#050510,#0a0f22,#141428,#050510)' }}>
            <div className="work-image-skyline" />
          </div>
          <span className="work-image-version">v1</span>
        </div>
        <div className="work-image-cell done">
          <div className="work-image-placeholder" style={{ background: 'linear-gradient(180deg,#02020a,#060a14,#02020a)' }}>
            <div className="work-image-skyline dark" />
          </div>
          <span className="work-image-version">v2</span>
        </div>
        <div className="work-image-cell generating">
          <RefreshCw size={28} className="work-spin" />
          <span>Generating v3…</span>
        </div>
        <div className="work-image-cell queued">
          <ImageIcon size={20} className="text-fg5" />
          <span>Queued v4</span>
        </div>
      </div>
    </div>
  );
}

export function ImageSidebar() {
  const images = [
    { id: 'v1', done: true },
    { id: 'v2', done: true },
    { id: 'v3', done: false, generating: true },
    { id: 'v4', done: false },
  ];

  return (
    <div className="work-sidebar-content work-sidebar-grid">
      {images.map((img) => (
        <div key={img.id} className={`work-sidebar-thumb ${img.done ? 'done' : img.generating ? 'generating' : 'queued'}`}>
          {img.done && <ImageIcon size={16} className="text-fg3" />}
          {img.generating && <RefreshCw size={14} className="work-spin text-accent" />}
          {!img.done && !img.generating && <ImageIcon size={14} className="text-fg5" />}
        </div>
      ))}
    </div>
  );
}

export function ImageRightPane() {
  const styles = ['Photorealistic', 'Illustration', 'Anime', 'Pixel Art', '3D Render', 'Sketch'];
  const aspects = ['1:1', '16:9', '4:3', '3:2'];

  return (
    <div className="work-right-content">
      <div className="work-section-title">Style Preset</div>
      <div className="work-style-grid">
        {styles.map((s, i) => (
          <div key={s} className={`work-style-item ${i === 0 ? 'active' : ''}`}>{s}</div>
        ))}
      </div>
      <div className="work-section-title">Aspect Ratio</div>
      <div className="work-aspect-row">
        {aspects.map((a, i) => (
          <div key={a} className={`work-aspect-item ${i === 0 ? 'active' : ''}`}>{a}</div>
        ))}
      </div>
      <div className="work-section-title">Generations</div>
      <div className="work-info-card">
        <div className="work-info-row"><span>Total</span><strong>4</strong></div>
        <div className="work-info-row"><span>Completed</span><strong className="text-success">2</strong></div>
        <div className="work-info-row"><span>Queued</span><strong className="text-accent">2</strong></div>
      </div>
    </div>
  );
}
