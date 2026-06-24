import { useState, useEffect, useRef } from 'react';
import { Search, Folder, Clock } from 'lucide-react';

interface Project {
  name: string;
  path: string;
  lastOpened?: Date;
}

interface ProjectPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (path: string) => void;
  recentProjects?: Project[];
}

export function ProjectPicker({
  isOpen,
  onClose,
  onSelectProject,
  recentProjects = [],
}: ProjectPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter projects based on search
  const filteredProjects = searchQuery.trim()
    ? recentProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentProjects;

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredProjects.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredProjects[selectedIndex]) {
            onSelectProject(filteredProjects[selectedIndex].path);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredProjects, selectedIndex, onSelectProject, onClose]);

  if (!isOpen) return null;

  return (
    <div className="project-picker-overlay" onClick={onClose}>
      <div className="project-picker" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="project-picker-search">
          <Search size={14} className="project-picker-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search projects..."
            className="project-picker-input"
          />
          <kbd className="project-picker-kbd">esc</kbd>
        </div>

        {/* Project list */}
        <div className="project-picker-list">
          <div className="project-picker-section-title">Recent Projects</div>
          {filteredProjects.length === 0 ? (
            <div className="project-picker-empty">
              {searchQuery ? 'No projects found' : 'No recent projects'}
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <button
                key={project.path}
                className={`project-picker-item ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => {
                  onSelectProject(project.path);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="project-picker-item-icon">
                  <Folder size={14} />
                </div>
                <div className="project-picker-item-content">
                  <span className="project-picker-item-name">{project.name}</span>
                  <span className="project-picker-item-path">{project.path}</span>
                </div>
                {project.lastOpened && (
                  <span className="project-picker-item-time">
                    <Clock size={10} />
                    {new Date(project.lastOpened).toLocaleDateString()}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
