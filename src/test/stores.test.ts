import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';

// Reset stores before each test
beforeEach(() => {
  useChatStore.setState({
    messages: [],
    isStreaming: false,
    pendingApproval: null,
    sessionAllowedTools: [],
    pendingDiffs: [],
  });
  useSessionStore.setState({
    projectPath: null,
    currentSessionId: null,
    sessions: [],
  });
  useSettingsStore.setState({
    model: 'grok-build',
    effort: null,
    planMode: false,
    alwaysApproveEnabled: false,
    language: 'zh',
    theme: 'dark',
    authMode: 'subscription',
    apiKey: '',
    dynamicModels: [],
  });
});

describe('ChatStore', () => {
  it('should add user message', () => {
    const { addUserMessage } = useChatStore.getState();
    addUserMessage('Hello');
    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Hello');
  });

  it('should add system message', () => {
    const { addSystemMessage } = useChatStore.getState();
    addSystemMessage('System info');
    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toBe('System info');
  });

  it('should clear messages', () => {
    const { addUserMessage, clearMessages } = useChatStore.getState();
    addUserMessage('Test');
    clearMessages();
    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(0);
  });

  it('should set streaming state', () => {
    const { setIsStreaming } = useChatStore.getState();
    setIsStreaming(true);
    expect(useChatStore.getState().isStreaming).toBe(true);
  });

  it('should handle text event', () => {
    const { handleGrokEvent } = useChatStore.getState();
    handleGrokEvent({ type: 'text', data: 'Hello from Grok' });
    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('assistant');
    expect(messages[0].content).toBe('Hello from Grok');
  });

  it('should handle end event', () => {
    const { setIsStreaming, handleGrokEvent } = useChatStore.getState();
    setIsStreaming(true);
    handleGrokEvent({ type: 'end', data: '' });
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it('should handle error event', () => {
    const { handleGrokEvent } = useChatStore.getState();
    handleGrokEvent({ type: 'error', data: 'Something went wrong' });
    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Error');
  });

  it('should allow tool for session', () => {
    const { allowToolForSession } = useChatStore.getState();
    allowToolForSession('read_file');
    expect(useChatStore.getState().sessionAllowedTools).toContain('read_file');
  });

  it('should resolve diff', () => {
    useChatStore.setState({
      pendingDiffs: [{ id: 'diff-1', filePath: 'test.ts', oldStr: 'old', newStr: 'new', status: 'pending' }],
    });
    const { resolveDiff } = useChatStore.getState();
    resolveDiff('diff-1', 'applied');
    expect(useChatStore.getState().pendingDiffs[0].status).toBe('applied');
  });
});

describe('SessionStore', () => {
  it('should set project path', () => {
    const { setProjectPath } = useSessionStore.getState();
    setProjectPath('/Users/test/project');
    expect(useSessionStore.getState().projectPath).toBe('/Users/test/project');
  });

  it('should set session id', () => {
    const { setSessionId } = useSessionStore.getState();
    setSessionId('session-123');
    expect(useSessionStore.getState().currentSessionId).toBe('session-123');
  });

  it('should add session', () => {
    const { addSession } = useSessionStore.getState();
    addSession({
      id: 'session-1',
      projectPath: '/test',
      projectName: 'Test',
      firstMessage: 'Hello',
      timestamp: Date.now(),
    });
    expect(useSessionStore.getState().sessions).toHaveLength(1);
  });

  it('should remove session', () => {
    useSessionStore.setState({
      sessions: [
        { id: 'session-1', projectPath: '/test', projectName: 'Test', firstMessage: 'Hello', timestamp: Date.now() },
        { id: 'session-2', projectPath: '/test2', projectName: 'Test2', firstMessage: 'World', timestamp: Date.now() },
      ],
    });
    const { removeSession } = useSessionStore.getState();
    removeSession('session-1');
    expect(useSessionStore.getState().sessions).toHaveLength(1);
    expect(useSessionStore.getState().sessions[0].id).toBe('session-2');
  });
});

describe('SettingsStore', () => {
  it('should set model', () => {
    const { setModel } = useSettingsStore.getState();
    setModel('grok-3');
    expect(useSettingsStore.getState().model).toBe('grok-3');
  });

  it('should set effort', () => {
    const { setEffort } = useSettingsStore.getState();
    setEffort('high');
    expect(useSettingsStore.getState().effort).toBe('high');
  });

  it('should toggle plan mode', () => {
    const { togglePlanMode } = useSettingsStore.getState();
    togglePlanMode();
    expect(useSettingsStore.getState().planMode).toBe(true);
    togglePlanMode();
    expect(useSettingsStore.getState().planMode).toBe(false);
  });

  it('should toggle always approve', () => {
    const { toggleAlwaysApprove } = useSettingsStore.getState();
    toggleAlwaysApprove();
    expect(useSettingsStore.getState().alwaysApproveEnabled).toBe(true);
  });

  it('should set language', () => {
    const { setLanguage } = useSettingsStore.getState();
    setLanguage('en');
    expect(useSettingsStore.getState().language).toBe('en');
  });

  it('should set theme', () => {
    const { setTheme } = useSettingsStore.getState();
    setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('should set dynamic models', () => {
    const { setDynamicModels } = useSettingsStore.getState();
    setDynamicModels([{ id: 'model-1', label: 'Model 1' }]);
    expect(useSettingsStore.getState().dynamicModels).toHaveLength(1);
  });
});
