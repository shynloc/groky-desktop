import { Plus, Brain } from 'lucide-react';

interface Task {
  title: string;
  tag: string;
  tagBg: string;
  tagColor: string;
  assignee: string;
  done?: boolean;
}

const inProgress: Task[] = [
  { title: 'Session persistence — save & restore state', tag: 'P0', tagBg: 'rgba(239,68,68,.1)', tagColor: '#ef4444', assignee: 'AK' },
  { title: 'Diff viewer with syntax highlighting', tag: 'P1', tagBg: 'rgba(249,115,22,.1)', tagColor: '#f97316', assignee: 'SH' },
];

const todo: Task[] = [
  { title: 'Voice module — audio playback + transcript', tag: 'P1', tagBg: 'rgba(249,115,22,.1)', tagColor: '#f97316', assignee: 'DL' },
  { title: 'Research module — web search + report gen', tag: 'P2', tagBg: 'rgba(59,130,246,.1)', tagColor: '#3b82f6', assignee: 'AK' },
  { title: 'Image generation with style presets', tag: 'P2', tagBg: 'rgba(59,130,246,.1)', tagColor: '#3b82f6', assignee: 'SH' },
  { title: 'MCP server visual configuration', tag: 'P3', tagBg: 'rgba(139,92,246,.1)', tagColor: '#8b5cf6', assignee: 'DL' },
];

const done: Task[] = [
  { title: 'Basic chat with streaming output', tag: 'P0', tagBg: 'rgba(34,197,94,.1)', tagColor: '#22c55e', assignee: 'AK', done: true },
  { title: 'File tree with project detection', tag: 'P0', tagBg: 'rgba(34,197,94,.1)', tagColor: '#22c55e', assignee: 'SH', done: true },
  { title: 'Permission approval modal', tag: 'P1', tagBg: 'rgba(34,197,94,.1)', tagColor: '#22c55e', assignee: 'DL', done: true },
];

function TaskCard({ task }: { task: Task }) {
  return (
    <div className={`work-task-card ${task.done ? 'done' : ''}`}>
      <div className={`work-task-check ${task.done ? 'checked' : ''}`}>
        {task.done && '✓'}
      </div>
      <span className={`work-task-title ${task.done ? 'line-through' : ''}`}>{task.title}</span>
      <span className="work-badge" style={{ background: task.tagBg, color: task.tagColor }}>{task.tag}</span>
      <span className="work-task-assignee">{task.assignee}</span>
    </div>
  );
}

export function ProjectsView() {
  return (
    <div className="work-view">
      <div className="work-projects-header">
        <div>
          <div className="work-projects-title">Product Roadmap 2025</div>
          <div className="work-projects-meta">7 open · 2 in progress · 3 done</div>
        </div>
        <button className="work-btn-accent"><Plus size={12} /> Add Task</button>
      </div>

      <div className="work-section-title accent">In Progress</div>
      {inProgress.map((t) => <TaskCard key={t.title} task={t} />)}

      <div className="work-section-title">To Do</div>
      {todo.map((t) => <TaskCard key={t.title} task={t} />)}

      <div className="work-section-title muted">Done</div>
      {done.map((t) => <TaskCard key={t.title} task={t} />)}

      <div className="work-ai-suggestion">
        <div className="work-ai-suggestion-header">
          <Brain size={12} className="text-info" />
          <span>Groky Suggestion</span>
        </div>
        <p>"Session persistence" is blocking 2 downstream features (Voice + Research integrations). Consider promoting it above the Image module sprint.</p>
        <button className="work-btn-ghost">Accept suggestion →</button>
      </div>
    </div>
  );
}

export function ProjectsSidebar() {
  const projects = [
    { name: 'Groky Desktop', tasks: 12, color: '#f97316' },
    { name: 'API Gateway', tasks: 8, color: '#3b82f6' },
    { name: 'Design System', tasks: 5, color: '#22c55e' },
    { name: 'Mobile App', tasks: 3, color: '#8b5cf6' },
  ];

  return (
    <div className="work-sidebar-content">
      {projects.map((p) => (
        <div key={p.name} className="work-sidebar-item">
          <div className="work-sidebar-dot" style={{ background: p.color }} />
          <div>
            <div className="work-sidebar-item-name">{p.name}</div>
            <div className="work-sidebar-item-meta">{p.tasks} open</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectsRightPane() {
  return (
    <div className="work-right-content">
      <div className="work-section-title">Sprint Progress</div>
      <div className="work-info-card">
        <div className="work-progress-header">
          <span>3 of 12 done</span>
          <span className="text-success">25%</span>
        </div>
        <div className="work-progress-bar">
          <div className="work-progress-fill" style={{ width: '25%' }} />
        </div>
        <div className="work-progress-footer">
          <span>2 in progress</span>
          <span>7 todo</span>
        </div>
      </div>
      <div className="work-section-title">Velocity</div>
      <div className="work-info-card">
        <div className="work-info-row"><span>Last sprint</span><strong>5 tasks</strong></div>
        <div className="work-info-row"><span>This sprint</span><strong className="text-accent">3 / 5</strong></div>
        <div className="work-info-row"><span>ETA</span><strong>Jun 30</strong></div>
      </div>
    </div>
  );
}
