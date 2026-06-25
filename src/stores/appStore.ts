// Re-export all stores for convenience
export { useChatStore } from './chatStore';
export { useSessionStore } from './sessionStore';
export { useSettingsStore } from './settingsStore';

// Combined store hook for backward compatibility
import { useChatStore } from './chatStore';
import { useSessionStore } from './sessionStore';
import { useSettingsStore } from './settingsStore';

export function useAppStore() {
  const chat = useChatStore();
  const session = useSessionStore();
  const settings = useSettingsStore();

  return {
    // Chat store
    messages: chat.messages,
    isStreaming: chat.isStreaming,
    pendingApproval: chat.pendingApproval,
    pendingDiffs: chat.pendingDiffs,
    addUserMessage: chat.addUserMessage,
    addSystemMessage: chat.addSystemMessage,
    handleGrokEvent: chat.handleGrokEvent,
    clearMessages: chat.clearMessages,
    setIsStreaming: chat.setIsStreaming,
    setPendingApproval: chat.setPendingApproval,
    allowToolForSession: chat.allowToolForSession,
    resolveDiff: chat.resolveDiff,
    clearDiffs: chat.clearDiffs,

    // Session store
    projectPath: session.projectPath,
    currentSessionId: session.currentSessionId,
    sessions: session.sessions,
    setProjectPath: session.setProjectPath,
    setSessionId: session.setSessionId,
    removeSession: session.removeSession,
    addSession: session.addSession,
    initSessions: session.initSessions,

    // Settings store
    model: settings.model,
    effort: settings.effort,
    planMode: settings.planMode,
    alwaysApproveEnabled: settings.alwaysApproveEnabled,
    language: settings.language,
    theme: settings.theme,
    authMode: settings.authMode,
    apiKey: settings.apiKey,
    dynamicModels: settings.dynamicModels,
    setModel: settings.setModel,
    setEffort: settings.setEffort,
    togglePlanMode: settings.togglePlanMode,
    toggleAlwaysApprove: settings.toggleAlwaysApprove,
    setLanguage: settings.setLanguage,
    setTheme: settings.setTheme,
    setAuthMode: settings.setAuthMode,
    setApiKey: settings.setApiKey,
    setDynamicModels: settings.setDynamicModels,
    initSettings: settings.initSettings,
  };
}
