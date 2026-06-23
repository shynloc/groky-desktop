const translations = {
  en: {
    // TopBar
    openProject: 'Open Project',
    newSession: 'New',
    plan: 'Plan',
    approve: 'Approve',
    streaming: 'streaming',
    // Sidebar
    explorer: 'Explorer',
    sessions: 'Sessions',
    noHistory: 'No history yet',
    openFolder: 'Open a folder',
    // Chat empty
    readyToBuild: 'Ready to build',
    readyDesc: 'Open a project folder to start collaborating with Grok.',
    readyExample: '"Explain the architecture"',
    openProjectFolder: 'Open Project Folder',
    dragFolder: 'Or drag a folder here',
    // Composer
    composerPlaceholder: 'Ask Groky anything… (Shift+Enter for newline)',
    openFolderToBegin: 'Open a project folder to begin',
    clickOrButton: 'Click here or use the button above',
    effortLabel: 'effort',
    // Right pane tabs
    tabContext: 'context',
    tabDiff: 'diff',
    tabExtensions: 'extensions',
    tabCommands: 'commands',
    tabSettings: 'settings',
    // Context pane
    project: 'Project',
    session: 'Session',
    activity: 'Activity',
    path: 'Path',
    model: 'Model',
    effort: 'Effort',
    mode: 'Mode',
    permission: 'Permission',
    toolCalls: 'Tool calls',
    filesRead: 'Files read',
    filesModified: 'Files modified',
    lastFile: 'Last file',
    // Settings tab
    config: 'Config',
    userConfig: 'User config',
    guiDefaults: 'Current GUI Defaults',
    output: 'Output',
    fileToolset: 'File toolset',
    autoCompact: 'Auto compact',
    language: 'Language',
    appearance: 'Appearance',
    darkMode: 'Dark',
    lightMode: 'Light',
    settingsNote: 'Settings sourced from official Grok Build config. GUI values override per-session.',
    // Approval
    permissionRequest: 'Permission Request',
    deny: 'Deny',
    allowOnce: 'Allow Once',
    allowSession: 'Allow Session',
    always: 'Always',
    // Diff
    pendingChange: 'pending change',
    pendingChanges: 'pending changes',
    accept: 'Accept',
    dismiss: 'Dismiss',
    diffEmpty: 'Diff preview appears here when Groky proposes file edits.',
    // Misc
    new: 'new',
    default: 'default',
    on: 'on',
    off: 'off',
    plan_mode: 'plan',
    alwaysApprove: 'always-approve',
    ask: 'ask',
  },
  zh: {
    // TopBar
    openProject: '打开项目',
    newSession: '新建',
    plan: '计划',
    approve: '审批',
    streaming: '流式输出',
    // Sidebar
    explorer: '资源管理器',
    sessions: '历史会话',
    noHistory: '暂无历史',
    openFolder: '打开文件夹',
    // Chat empty
    readyToBuild: '准备开始',
    readyDesc: '打开一个项目文件夹，开始与 Grok 协作。',
    readyExample: '"解释一下这个项目的架构"',
    openProjectFolder: '打开项目文件夹',
    dragFolder: '或将文件夹拖到这里',
    // Composer
    composerPlaceholder: '问 Groky 任何问题… (Shift+Enter 换行)',
    openFolderToBegin: '打开项目文件夹以开始',
    clickOrButton: '点击这里或使用上方按钮',
    effortLabel: '强度',
    // Right pane tabs
    tabContext: '状态',
    tabDiff: '差异',
    tabExtensions: '扩展',
    tabCommands: '命令',
    tabSettings: '设置',
    // Context pane
    project: '项目',
    session: '会话',
    activity: '活动',
    path: '路径',
    model: '模型',
    effort: '强度',
    mode: '模式',
    permission: '权限',
    toolCalls: '工具调用',
    filesRead: '已读文件',
    filesModified: '已修改文件',
    lastFile: '最近文件',
    // Settings tab
    config: '配置',
    userConfig: '用户配置',
    guiDefaults: '当前 GUI 默认值',
    output: '输出',
    fileToolset: '文件工具集',
    autoCompact: '自动压缩',
    language: '语言',
    appearance: '外观',
    darkMode: '深色',
    lightMode: '浅色',
    settingsNote: '设置来源于 Grok Build 官方配置，GUI 值每次会话覆盖。',
    // Approval
    permissionRequest: '权限请求',
    deny: '拒绝',
    allowOnce: '允许一次',
    allowSession: '本次会话允许',
    always: '始终允许',
    // Diff
    pendingChange: '项待确认变更',
    pendingChanges: '项待确认变更',
    accept: '接受',
    dismiss: '忽略',
    diffEmpty: 'Grok 提议文件修改时，差异预览将显示在这里。',
    // Misc
    new: '新建',
    default: '默认',
    on: '开启',
    off: '关闭',
    plan_mode: '计划',
    alwaysApprove: '始终审批',
    ask: '询问',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];

export function t(lang: Language, key: TranslationKey): string {
  return (translations[lang] as Record<string, string>)[key] ?? (translations['en'] as Record<string, string>)[key] ?? key;
}
