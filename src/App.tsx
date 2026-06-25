import { useEffect, useMemo, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Clock, Key, Layers, Moon, Play, RefreshCw, Sun, Terminal, Trash2, Plus } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { Composer } from './components/Composer';
import { ChatPane } from './components/ChatPane';
import { FileTree } from './components/FileTree';
import { ApprovalModal } from './components/ApprovalModal';
import { DiffView } from './components/DiffView';
import { IconDock, AppMode, WorkView } from './components/IconDock';
import { CommandPalette, createDefaultCommands } from './components/CommandPalette';
import { ProjectPicker } from './components/ProjectPicker';
import { SuggestedPrompts, getDefaultPrompts } from './components/SuggestedPrompts';
import { DocsView, DocsSidebar, DocsRightPane } from './components/work/DocsView';
import { ImageView, ImageSidebar, ImageRightPane } from './components/work/ImageView';
import { VoiceView, VoiceSidebar, VoiceRightPane } from './components/work/VoiceView';
import { ProjectsView, ProjectsSidebar, ProjectsRightPane } from './components/work/ProjectsView';
import { ResearchView, ResearchSidebar, ResearchRightPane } from './components/work/ResearchView';
import { WorkChatSidebar } from './components/work/WorkChatSidebar';
import { useAppStore } from './stores/appStore';
import { GrokEvent } from './types';
import { t } from './i18n';
import { getApiKey, migrateFromLocalStorage } from './services/secureStore';

// Tauri 2 injects __TAURI_INTERNALS__ (not __TAURI__) in the webview runtime.
const IS_TAURI = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined';

function App() {
  const [rightTab, setRightTab] = useState<'context' | 'diff' | 'extensions' | 'commands' | 'settings'>('context');
  const [inspectText, setInspectText] = useState('');
  const [inspectStatus, setInspectStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [modelRefreshing, setModelRefreshing] = useState(false);
  const [modelRefreshError, setModelRefreshError] = useState('');
  const [appMode, setAppMode] = useState<AppMode>('build');
  const [workView, setWorkView] = useState<WorkView>('chat');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  const {
    projectPath, setProjectPath,
    currentSessionId, setSessionId,
    messages, isStreaming, setIsStreaming,
    model, alwaysApproveEnabled,
    effort, planMode,
    addUserMessage, addSystemMessage, handleGrokEvent, clearMessages,
    pendingApproval, setPendingApproval, allowToolForSession,
    pendingDiffs, resolveDiff,
    sessions, removeSession, addSession,
    language, setLanguage,
    theme, setTheme,
    authMode, setAuthMode,
    apiKey, setApiKey,
    dynamicModels, setDynamicModels,
    initSettings,
  } = useAppStore();

  const [apiKeyInput, setApiKeyInput] = useState(apiKey);

  const T = (key: Parameters<typeof t>[1]) => t(language, key);

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load persisted settings and API key on startup
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await migrateFromLocalStorage();
        await initSettings();
        if (IS_TAURI) {
          const storedKey = await getApiKey();
          if (storedKey) {
            setApiKey(storedKey);
            setApiKeyInput(storedKey);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [setApiKey, initSettings]);

  // Command Palette keyboard shortcut (⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshModels = async (key?: string) => {
    if (!IS_TAURI) return;
    setModelRefreshing(true);
    setModelRefreshError('');
    try {
      const models = await invoke<string[]>('get_grok_models', {
        apiKey: key ?? (authMode === 'apikey' ? apiKey : undefined),
      });
      setDynamicModels(models.map((id) => ({ id, label: id })));
    } catch (err) {
      setModelRefreshError(String(err));
    } finally {
      setModelRefreshing(false);
    }
  };

  // Auto-refresh models on startup
  useEffect(() => {
    refreshModels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // B5: Stable ref so cleanup always calls the resolved unlisten fn.
  const unlistenRef = useRef<(() => void) | null>(null);
  const handleGrokEventRef = useRef(handleGrokEvent);
  const setSessionIdRef = useRef(setSessionId);
  const addSessionRef = useRef(addSession);
  const projectPathRef = useRef(projectPath);
  const firstMessageRef = useRef<string | null>(null);

  // Update refs when values change
  useEffect(() => { handleGrokEventRef.current = handleGrokEvent; }, [handleGrokEvent]);
  useEffect(() => { setSessionIdRef.current = setSessionId; }, [setSessionId]);
  useEffect(() => { addSessionRef.current = addSession; }, [addSession]);
  useEffect(() => { projectPathRef.current = projectPath; }, [projectPath]);

  useEffect(() => {
    const handler = (event: { payload: GrokEvent }) => {
      const { session_id, type } = event.payload;
      handleGrokEventRef.current(event.payload);

      // Capture session_id from grok events
      if (session_id) {
        setSessionIdRef.current(session_id);
      }

      // Save session to history when stream ends
      if (type === 'end' && projectPathRef.current && firstMessageRef.current) {
        const path = projectPathRef.current;
        addSessionRef.current({
          id: session_id || `local-${Date.now()}`,
          projectPath: path,
          projectName: path.split('/').pop() || path,
          firstMessage: firstMessageRef.current,
          timestamp: Date.now(),
        });
        firstMessageRef.current = null;
      }
    };

    listen<GrokEvent>('grok-event', handler).then((fn) => {
      unlistenRef.current = fn;
    });
    return () => { unlistenRef.current?.(); };
  }, []);

  const handleOpenFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Open Project Folder' });
      if (selected && typeof selected === 'string') {
        setProjectPath(selected);
        clearMessages();
        addSystemMessage(`Project opened: ${selected}\n\nAsk me anything about the codebase!`);
      }
    } catch (err) {
      console.error('Failed to open folder', err);
    }
  };

  const handleSend = async (rawPrompt: string) => {
    if (!projectPath) return;

    // Resolve @file references — inject actual file content into the prompt
    let processedPrompt = rawPrompt;
    if (IS_TAURI) {
      const fileRefs = rawPrompt.match(/@[\w./\-]+(?:\.\w+)*/g) ?? [];
      for (const ref of fileRefs) {
        const relPath = ref.slice(1);
        const absPath = relPath.startsWith('/') ? relPath : `${projectPath}/${relPath}`;
        try {
          const content = await invoke<string>('read_file_content', { 
            path: absPath,
            projectPath: projectPath 
          });
          const ext = relPath.split('.').pop() ?? '';
          processedPrompt = processedPrompt.replace(
            ref,
            `\n\`\`\`${ext}\n// ${relPath}\n${content}\n\`\`\``
          );
        } catch {
          // Leave ref as-is if file not found
        }
      }
    }

    addUserMessage(rawPrompt);
    if (!firstMessageRef.current) {
      firstMessageRef.current = rawPrompt.slice(0, 120);
    }
    setIsStreaming(true);

    try {
      await invoke('send_grok_prompt', {
        prompt: processedPrompt,
        cwd: projectPath,
        session_id: currentSessionId,
        model,
        always_approve: alwaysApproveEnabled,
        plan_mode: planMode,
        effort,
        api_key: authMode === 'apikey' && apiKey ? apiKey : undefined,
      });
    } catch (err: any) {
      setIsStreaming(false);
      console.warn('Grok call failed:', err);

      if (!IS_TAURI) {
        addSystemMessage(
          '⚠️ 你当前是在浏览器中运行（npm run dev）。\n\n真实桌面集成需要用 `npm run tauri:dev` 启动。\n\n现在先用模拟响应演示 UI。安装 Rust 后即可使用真实 Grok。'
        );
      }
      simulateDemoResponse(rawPrompt);
    }
  };

  const simulateDemoResponse = (prompt: string) => {
    setTimeout(() => {
      handleGrokEvent({
        type: 'text',
        data: `Thanks for the prompt: "${prompt}"\n\nThis is a simulated response from Grok Build.\n\nIn a real run, this would stream live from the \`grok\` CLI using streaming-json.`,
      });
      handleGrokEvent({ type: 'end', data: '' });
    }, 650);
  };

  const handleNewSession = () => {
    setSessionId(null);
    clearMessages();
    addSystemMessage('New Grok Build session started. Headless runs will create a fresh session on the next prompt.');
  };

  const handleFileClick = (path: string) => {
    const relative = projectPath && path.startsWith(`${projectPath}/`)
      ? path.slice(projectPath.length + 1)
      : path;
    setPendingFile(relative);
  };

  const handleSessionResume = (session: { id: string; projectPath: string; projectName: string; firstMessage: string }) => {
    setProjectPath(session.projectPath);
    setSessionId(session.id);
    // Do not clear messages — preserve current chat context.
    // The next prompt will resume the grok session transparently.
    addSystemMessage(`已恢复会话：${session.projectName} · "${session.firstMessage}…"`);
  };

  const handleApplyDiff = async (id: string) => {
    const diff = pendingDiffs.find((d) => d.id === id);
    if (!diff || !projectPath) {
      resolveDiff(id, 'applied');
      return;
    }

    if (IS_TAURI) {
      try {
        await invoke('apply_diff', {
          filePath: diff.filePath,
          oldStr: diff.oldStr,
          newStr: diff.newStr,
          projectPath,
        });
      } catch (err) {
        console.error('Failed to apply diff:', err);
        addSystemMessage(`Failed to apply diff to ${diff.filePath}: ${err}`);
        resolveDiff(id, 'rejected');
        return;
      }
    }
    resolveDiff(id, 'applied');
  };

  const activity = useMemo(() => {
    const toolCalls = messages.flatMap((m) => m.toolCalls ?? []);
    const filePaths = toolCalls.map((t) => t.filePath).filter(Boolean);
    return {
      toolCalls: toolCalls.length,
      filesRead: toolCalls.filter((t) => /read|list|grep|search/i.test(t.tool)).length,
      filesModified: toolCalls.filter((t) => /write|edit|replace|patch/i.test(t.tool)).length,
      lastFile: filePaths[filePaths.length - 1] ?? '—',
    };
  }, [messages]);

  const projectName = projectPath?.split('/').pop() || 'No project';
  const effortLabel = effort ?? 'default';
  const permissionLabel = alwaysApproveEnabled ? 'always-approve' : 'ask';
  const pendingDiffCount = pendingDiffs.filter((d) => d.status === 'pending').length;

  const refreshInspect = async () => {
    if (!projectPath) {
      setInspectText('Open a project folder, then run grok inspect.');
      setInspectStatus('idle');
      return;
    }
    if (!IS_TAURI) {
      setInspectText('grok inspect is available in the Tauri desktop runtime.');
      setInspectStatus('ready');
      return;
    }
    setInspectStatus('loading');
    try {
      const result = await invoke<{ stdout: string; stderr: string; status: number | null }>('inspect_grok', { cwd: projectPath });
      setInspectText([result.stdout, result.stderr].filter(Boolean).join('\n') || 'grok inspect returned no output.');
      setInspectStatus(result.status === 0 ? 'ready' : 'error');
    } catch (err) {
      setInspectText(String(err));
      setInspectStatus('error');
    }
  };

  useEffect(() => {
    if (rightTab === 'extensions' && inspectStatus === 'idle') {
      refreshInspect();
    }
  }, [rightTab, inspectStatus]);

  return (
    <div className="groky-app">
      {!IS_TAURI && (
        <div className="demo-ribbon">
          Demo mode — run <span className="type-mono text-accent">npm run tauri:dev</span> for the real desktop experience
        </div>
      )}

      <TopBar
        projectPath={projectPath}
        isStreaming={isStreaming}
        onOpenFolder={handleOpenFolder}
        onOpenSettings={() => setRightTab('settings')}
        onNewSession={handleNewSession}
        language={language}
      />

      <div className="main-layout">
        {/* ── Icon Dock ─────────────────────────────────────────────────────── */}
        <IconDock
          mode={appMode}
          workView={workView}
          onModeChange={setAppMode}
          onWorkViewChange={setWorkView}
          onOpenSettings={() => setRightTab('settings')}
          language={language}
        />

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="sidebar">
          {appMode === 'work' ? (
            <>
              <div className="panel-heading">
                <span>{workView.charAt(0).toUpperCase() + workView.slice(1)}</span>
                <button className="sidebar-add-btn"><Plus size={12} /></button>
              </div>
              <div className="sidebar-work-content">
                {workView === 'chat' && <WorkChatSidebar />}
                {workView === 'docs' && <DocsSidebar />}
                {workView === 'image' && <ImageSidebar />}
                {workView === 'voice' && <VoiceSidebar />}
                {workView === 'projects' && <ProjectsSidebar />}
                {workView === 'research' && <ResearchSidebar />}
              </div>
            </>
          ) : (
            <>
              <div className="panel-heading">
                <span>{T('explorer')}</span>
              </div>
              <FileTree
                projectPath={projectPath}
                onFileClick={handleFileClick}
                onOpenFolder={handleOpenFolder}
              />

              <div className="sessions-footer">
                <div className="panel-kicker">{T('sessions')}</div>
                {sessions.length === 0 ? (
                  <div className="empty-caption">{T('noHistory')}</div>
                ) : (
                  <div className="session-list">
                    {sessions.map((sess) => (
                      <div key={sess.id} className="session-item">
                        <button
                          className="session-item-main"
                          onClick={() => handleSessionResume(sess)}
                          title={`Resume: ${sess.projectPath}`}
                        >
                          <div className="session-item-name">{sess.projectName}</div>
                          <div className="session-item-preview">{sess.firstMessage}</div>
                          <div className="session-item-time">
                            <Clock size={9} />
                            {new Date(sess.timestamp).toLocaleDateString()}
                          </div>
                        </button>
                        <button
                          className="session-item-delete"
                          onClick={(e) => { e.stopPropagation(); removeSession(sess.id); }}
                          title="Remove from history"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Main area ─────────────────────────────────────────────────────── */}
        <div className="chat-area">
          {appMode === 'work' ? (
            <div className="work-main">
              {workView === 'chat' && (
                <>
                  <ChatPane messages={messages} isStreaming={isStreaming} onOpenFolder={handleOpenFolder} language={language} />
                  <Composer
                    onSend={handleSend}
                    disabled={isStreaming}
                    projectPath={projectPath}
                    onOpenFolder={handleOpenFolder}
                    pendingFile={pendingFile}
                    onPendingFileConsumed={() => setPendingFile(null)}
                    language={language}
                  />
                </>
              )}
              {workView === 'docs' && <DocsView />}
              {workView === 'image' && <ImageView />}
              {workView === 'voice' && <VoiceView />}
              {workView === 'projects' && <ProjectsView />}
              {workView === 'research' && <ResearchView />}
            </div>
          ) : (
            <>
              <ChatPane messages={messages} isStreaming={isStreaming} onOpenFolder={handleOpenFolder} language={language} />
              <Composer
                onSend={handleSend}
                disabled={isStreaming}
                projectPath={projectPath}
                onOpenFolder={handleOpenFolder}
                pendingFile={pendingFile}
                onPendingFileConsumed={() => setPendingFile(null)}
                language={language}
              />
            </>
          )}
        </div>

        {/* ── Right pane ──────────────────────────────────────────────────── */}
        <div className="right-pane">
          {appMode === 'work' ? (
            <div className="right-scroll">
              <SuggestedPrompts
                prompts={getDefaultPrompts(!!projectPath)}
                onSelect={(prompt) => handleSend(prompt)}
              />
              {workView === 'chat' && (
                <div className="context-pane">
                  <section>
                    <div className="panel-kicker">{T('session')}</div>
                    <div className="info-table">
                      <div><span>{T('model')}</span><strong className="text-accent">{model}</strong></div>
                      <div><span>Context</span><strong>256k</strong></div>
                      <div><span>{T('mode')}</span><strong>GrokWork</strong></div>
                    </div>
                  </section>
                </div>
              )}
              {workView === 'docs' && <DocsRightPane />}
              {workView === 'image' && <ImageRightPane />}
              {workView === 'voice' && <VoiceRightPane />}
              {workView === 'projects' && <ProjectsRightPane />}
              {workView === 'research' && <ResearchRightPane />}
            </div>
          ) : (
            <>
              <div className="right-tabs">
                {([
                  ['context',    T('tabContext')],
                  ['diff',       pendingDiffCount > 0 ? `${T('tabDiff')}·${pendingDiffCount}` : T('tabDiff')],
                  ['extensions', T('tabExtensions')],
                  ['commands',   T('tabCommands')],
                  ['settings',   T('tabSettings')],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setRightTab(key as typeof rightTab)}
                    className={rightTab === key ? 'active' : ''}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {rightTab === 'context' && (
                <div className="right-scroll context-pane">
                  <SuggestedPrompts
                    prompts={getDefaultPrompts(!!projectPath)}
                    onSelect={(prompt) => { handleSend(prompt); }}
                  />
                  <section>
                    <div className="panel-kicker">{T('project')}</div>
                    <div className="info-box">
                      <div className="info-label">{T('path')}</div>
                      <div className="info-value break-anywhere">{projectPath || '—'}</div>
                    </div>
                  </section>
                  <section>
                    <div className="panel-kicker">{T('session')}</div>
                    <div className="info-table">
                      <div><span>ID</span><strong>{currentSessionId || T('new')}</strong></div>
                      <div><span>{T('project')}</span><strong>{projectName}</strong></div>
                      <div><span>{T('model')}</span><strong className="text-accent">{model}</strong></div>
                      <div><span>{T('effort')}</span><strong>{effortLabel}</strong></div>
                      <div><span>{T('mode')}</span><strong>{planMode ? T('plan_mode') : T('default')}</strong></div>
                      <div><span>{T('permission')}</span><strong>{permissionLabel}</strong></div>
                    </div>
                  </section>
                  <section>
                    <div className="panel-kicker">{T('activity')}</div>
                    <div className="info-table">
                      <div><span>{T('toolCalls')}</span><strong>{activity.toolCalls}</strong></div>
                      <div><span>{T('filesRead')}</span><strong>{activity.filesRead}</strong></div>
                      <div><span>{T('filesModified')}</span><strong className="text-accent">{activity.filesModified}</strong></div>
                      <div><span>{T('lastFile')}</span><strong title={activity.lastFile}>{activity.lastFile}</strong></div>
                    </div>
                  </section>
                </div>
              )}

              {rightTab === 'diff' && (
                <div className="right-scroll">
                  <DiffView diffs={pendingDiffs} onApply={handleApplyDiff} onReject={(id) => resolveDiff(id, 'rejected')} />
                </div>
              )}

              {rightTab === 'extensions' && (
                <div className="right-scroll skills-pane">
                  <div className="extensions-header">
                    <div>
                      <div className="panel-kicker">Extensions</div>
                      <p>Skills, plugins, hooks, MCPs, marketplaces</p>
                    </div>
                    <button onClick={refreshInspect} title="Run grok inspect">
                      <RefreshCw size={13} className={inspectStatus === 'loading' ? 'spin' : ''} />
                    </button>
                  </div>
                  {([
                    ['skills',      './.grok/skills · ~/.grok/skills · plugin skills'],
                    ['plugins',     './.grok/plugins · ~/.grok/plugins · marketplaces'],
                    ['hooks',       '~/.grok/hooks · project hooks after /hooks-trust'],
                    ['MCP',         'Enabled plugin and config-provided MCP servers'],
                    ['marketplace', 'Configured sources from config.toml'],
                    ['subagents',   'Parallel child sessions for delegated work'],
                  ] as const).map(([name, desc]) => (
                    <button key={name} className="skill-row">
                      <div><span>{name}</span><p>{desc}</p></div>
                      <Play size={12} />
                    </button>
                  ))}
                  <div className={`inspect-box ${inspectStatus}`}>
                    <div className="inspect-title">
                      <Terminal size={12} /><span>grok inspect</span>
                    </div>
                    <pre>{inspectText || 'Run inspect to see discovered config sources, instructions, skills, plugins, hooks, and MCP servers.'}</pre>
                  </div>
                </div>
              )}

              {rightTab === 'commands' && (
                <div className="right-scroll skills-pane">
                  <div className="panel-kicker">Slash Commands</div>
                  {([
                    ['/new',                    'Start a new session'],
                    ['/resume',                 'Resume previous sessions'],
                    ['/sessions',               'Browse and pick past sessions'],
                    ['/fork',                   'Fork the current session'],
                    ['/share',                  'Share the current session via URL'],
                    ['/context',                'View context usage'],
                    ['/model <name>',           'Switch active model'],
                    ['/always-approve',         'Toggle permission prompts'],
                    ['/compact [context]',      'Compact conversation history'],
                    ['/plan',                   'View the current session plan'],
                    ['/usage',                  'Show token and credit usage'],
                    ['/plugins /hooks /skills', 'Open the unified extensions modal'],
                  ] as const).map(([name, desc]) => (
                    <button key={name} className="skill-row command-row">
                      <div><span>{name}</span><p>{desc}</p></div>
                    </button>
                  ))}
                </div>
              )}

              {rightTab === 'settings' && (
                <div className="right-scroll context-pane">
                  <section>
                    <div className="panel-kicker">Auth</div>
                    <div className="settings-toggle-group">
                      <button className={`settings-toggle-btn ${authMode === 'subscription' ? 'active' : ''}`} onClick={() => { setAuthMode('subscription'); refreshModels(); }}>Grok 订阅</button>
                      <button className={`settings-toggle-btn ${authMode === 'apikey' ? 'active' : ''}`} onClick={() => setAuthMode('apikey')}><Key size={12} /> API Key</button>
                    </div>
                  </section>
                  {authMode === 'apikey' && (
                    <section>
                      <div className="panel-kicker">xAI API Key</div>
                      <div className="api-key-row">
                        <input type="password" className="api-key-input" placeholder="xai-..." value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} />
                        <button className="api-key-save" onClick={() => { setApiKey(apiKeyInput); refreshModels(apiKeyInput); }}>保存</button>
                      </div>
                      <div className="api-key-hint">从 <span className="type-mono">console.x.ai</span> 获取 API Key</div>
                    </section>
                  )}
                  <section>
                    <div className="panel-kicker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>可用模型</span>
                      <button onClick={() => refreshModels()} className="model-refresh-btn" title="Run grok models">
                        <RefreshCw size={11} className={modelRefreshing ? 'spin' : ''} />
                      </button>
                    </div>
                    {modelRefreshError && <div className="model-refresh-error">{modelRefreshError}</div>}
                    <div className="detected-models">
                      {(dynamicModels.length > 0 ? dynamicModels : []).map((m) => (<div key={m.id} className="detected-model-item type-mono">{m.id}</div>))}
                      {dynamicModels.length === 0 && !modelRefreshing && <div className="empty-caption">点击刷新获取可用模型</div>}
                      {modelRefreshing && <div className="empty-caption">检测中…</div>}
                    </div>
                  </section>
                  <section>
                    <div className="panel-kicker">{T('appearance')}</div>
                    <div className="settings-toggle-group">
                      <button className={`settings-toggle-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}><Moon size={13} /> {T('darkMode')}</button>
                      <button className={`settings-toggle-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}><Sun size={13} /> {T('lightMode')}</button>
                    </div>
                  </section>
                  <section>
                    <div className="panel-kicker">{T('language')}</div>
                    <div className="settings-toggle-group">
                      <button className={`settings-toggle-btn ${language === 'zh' ? 'active' : ''}`} onClick={() => setLanguage('zh')}>中文</button>
                      <button className={`settings-toggle-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>English</button>
                    </div>
                  </section>
                  <div className="skills-note"><Layers size={13} /> {T('settingsNote')}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Approval modal (portal-like overlay) ──────────────────────────── */}
      {pendingApproval && (
        <ApprovalModal
          request={pendingApproval}
          onResolve={(action) => {
            if (action === 'session') {
              allowToolForSession(pendingApproval.tool);
            }
            setPendingApproval(null);
          }}
        />
      )}

      {/* ── Command Palette ──────────────────────────────────────────────── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={createDefaultCommands({
          onOpenFolder: handleOpenFolder,
          onNewSession: handleNewSession,
          onOpenSettings: () => setRightTab('settings'),
        })}
      />

      {/* ── Project Picker ───────────────────────────────────────────────── */}
      <ProjectPicker
        isOpen={projectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        onSelectProject={(path) => {
          setProjectPath(path);
          clearMessages();
          addSystemMessage(`Project opened: ${path}\n\nAsk me anything about the codebase!`);
        }}
        recentProjects={sessions.map((s) => ({
          name: s.projectName,
          path: s.projectPath,
          lastOpened: new Date(s.timestamp),
        }))}
      />
    </div>
  );
}

export default App;
