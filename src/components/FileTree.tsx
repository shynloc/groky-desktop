import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { List } from 'react-window';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, FolderOpen as FolderOpenIcon, Loader2 } from 'lucide-react';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

interface TreeNode extends FileEntry {
  children?: TreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
}

interface FileTreeProps {
  projectPath: string | null;
  onFileClick?: (path: string) => void;
  onOpenFolder?: () => void;
}

async function fetchEntries(path: string, projectPath?: string | null): Promise<TreeNode[]> {
  const entries = await invoke<FileEntry[]>('list_directory', {
    path,
    projectPath: projectPath ?? undefined,
  });
  return entries.map((e) => ({
    ...e,
    isExpanded: false,
    isLoading: false,
  }));
}

function TreeRow({
  node,
  depth,
  onToggle,
  onFileClick,
}: {
  node: TreeNode;
  depth: number;
  onToggle: (path: string) => void;
  onFileClick?: (path: string) => void;
}) {
  const indent = depth * 12;

  const handleClick = () => {
    if (node.is_dir) {
      onToggle(node.path);
    } else {
      onFileClick?.(node.path);
    }
  };

  return (
    <div
      className="file-tree-item cursor-pointer select-none"
      style={{ paddingLeft: `${8 + indent}px`, paddingRight: '8px' }}
      onClick={handleClick}
      title={node.path}
    >
      {node.is_dir ? (
        <>
          <span style={{ color: 'var(--fg-5)', display: 'flex', width: 13, flexShrink: 0 }}>
            {node.isLoading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : node.isExpanded ? (
              <ChevronDown size={11} />
            ) : (
              <ChevronRight size={11} />
            )}
          </span>
          {node.isExpanded ? (
            <FolderOpen size={13} style={{ color: 'var(--accent)', opacity: 0.75, flexShrink: 0 }} />
          ) : (
            <Folder size={13} style={{ color: 'var(--fg-4)', flexShrink: 0 }} />
          )}
        </>
      ) : (
        <>
          <span style={{ width: 13, flexShrink: 0 }} />
          <File size={13} style={{ color: 'var(--fg-5)', flexShrink: 0 }} />
        </>
      )}
      <span className="truncate" style={{ color: 'var(--fg-2)' }}>{node.name}</span>
    </div>
  );
}

// Flatten tree structure for virtualization
function flattenTree(nodes: TreeNode[], depth: number = 0): Array<{ node: TreeNode; depth: number }> {
  const result: Array<{ node: TreeNode; depth: number }> = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.is_dir && node.isExpanded && node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

// Virtualized row component
function VirtualRow({
  index,
  style,
  items,
  onToggle,
  onFileClick,
}: {
  index: number;
  style: React.CSSProperties;
  items: Array<{ node: TreeNode; depth: number }>;
  onToggle: (path: string) => void;
  onFileClick?: (path: string) => void;
}) {
  const { node, depth } = items[index];
  return (
    <div style={style}>
      <TreeRow
        node={node}
        depth={depth}
        onToggle={onToggle}
        onFileClick={onFileClick}
      />
    </div>
  );
}

export function FileTree({ projectPath, onFileClick, onOpenFolder }: FileTreeProps) {
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load root directory whenever projectPath changes
  useEffect(() => {
    if (!projectPath) {
      setRoots([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }
    setLoadError(null);
    setIsLoading(true);
    fetchEntries(projectPath, projectPath)
      .then((entries) => { setRoots(entries); setIsLoading(false); })
      .catch((e) => { setLoadError(String(e)); setIsLoading(false); });
  }, [projectPath]);

  const handleToggle = useCallback(async (path: string) => {
    // Recursive helper that finds a node and toggles it
    const toggleNode = async (nodes: TreeNode[]): Promise<TreeNode[]> => {
      return Promise.all(
        nodes.map(async (n) => {
          if (n.path === path) {
            if (!n.is_dir) return n;
            if (n.isExpanded) {
              // Collapse
              return { ...n, isExpanded: false };
            }
            if (n.children) {
              // Already loaded — just expand
              return { ...n, isExpanded: true };
            }
            // Load children
            const loading = { ...n, isLoading: true, isExpanded: false };
            return loading;
          }
          if (n.children) {
            return { ...n, children: await toggleNode(n.children) };
          }
          return n;
        }),
      );
    };

    // First pass: mark as loading
    setRoots((prev) =>
      prev.map((n) => (n.path === path ? { ...n, isLoading: true } : n)),
    );

    // Fetch children then update tree
    try {
      const children = await fetchEntries(path);
      setRoots((prev) => {
        const update = (nodes: TreeNode[]): TreeNode[] =>
          nodes.map((n) => {
            if (n.path === path) {
              const wasExpanded = n.isExpanded;
              return {
                ...n,
                isLoading: false,
                isExpanded: !wasExpanded,
                children: n.children ?? children,
              };
            }
            if (n.children) return { ...n, children: update(n.children) };
            return n;
          });
        return update(prev);
      });
    } catch {
      setRoots((prev) =>
        prev.map((n) => (n.path === path ? { ...n, isLoading: false } : n)),
      );
    }
  }, []);

  // Flatten tree for virtualization
  const flatItems = useMemo(() => flattenTree(roots), [roots]);

  if (!projectPath) {
    return (
      <div className="p-4 text-center">
        <button
          onClick={onOpenFolder}
          className="text-xs text-white/40 hover:text-orange-400 flex flex-col items-center gap-1 py-3 w-full"
        >
          <FolderOpenIcon size={18} />
          <span>Open a folder</span>
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-3 text-[11px] text-red-400/80 font-mono break-all">
        {loadError}
      </div>
    );
  }

  // Use virtualized list for large trees
  if (flatItems.length > 100) {
    return (
      <div className="file-tree-scroll flex-1">
        <List
          defaultHeight={600}
          rowCount={flatItems.length}
          rowHeight={22}
          rowComponent={({ index, style, ...props }) => (
            <VirtualRow
              index={index}
              style={style}
              items={flatItems}
              onToggle={handleToggle}
              onFileClick={onFileClick}
              {...props}
            />
          )}
          rowProps={{}}
        />
        {isLoading && (
          <div className="file-tree-status">
            <Loader2 size={11} className="animate-spin flex-shrink-0" />
            <span>加载中…</span>
          </div>
        )}
      </div>
    );
  }

  // Use regular rendering for small trees
  return (
    <div className="file-tree-scroll overflow-auto flex-1 py-1">
      {flatItems.map(({ node, depth }) => (
        <TreeRow
          key={node.path}
          node={node}
          depth={depth}
          onToggle={handleToggle}
          onFileClick={onFileClick}
        />
      ))}
      {isLoading && (
        <div className="file-tree-status">
          <Loader2 size={11} className="animate-spin flex-shrink-0" />
          <span>加载中…</span>
        </div>
      )}
      {!isLoading && roots.length === 0 && !loadError && (
        <div className="file-tree-status">空目录</div>
      )}
    </div>
  );
}
