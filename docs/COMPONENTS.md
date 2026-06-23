# Groky 组件拆分与 UI 规范

**版本**：v0.1  
**日期**：2026-06-23

---

## 1. 整体布局（Layout）

推荐采用现代 AI Coding Desktop 经典三栏布局（可折叠）：

```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar (项目名 + 模型选择 + 连接状态 + 快捷操作 + 用户头像)     │
├──────────────┬────────────────────────────────┬─────────────────┤
│              │                                │                 │
│  LeftSidebar │        MainChatPane            │   RightPane     │
│  (Files /    │  (消息列表 + Tool Timeline)    │  (Artifacts /   │
│   Sessions)  │                                │   Diff / Skills)│
│              │                                │                 │
│              │        ┌────────────────────┐  │                 │
│              │        │   Composer         │  │                 │
│              │        │   (输入 + @ + 技能)│  │                 │
│              │        └────────────────────┘  │                 │
├──────────────┴────────────────────────────────┴─────────────────┤
│  StatusBar (当前模式: Plan/YOLO、权限规则数、grok 版本、token 用量)│
└─────────────────────────────────────────────────────────────────┘
```

- **响应式**：macOS 全屏优先，窄屏时 RightPane 可抽屉化或隐藏
- **键盘优先**：几乎所有操作都有快捷键
- **主题**：默认深色（Grok 风格），支持亮色 + 自定义 accent（建议橙/紫系）

---

## 2. 主要组件层级

```
App
├── TopBar
├── Layout
│   ├── LeftSidebar
│   │   ├── ProjectSelector
│   │   ├── FileTree
│   │   └── SessionList
│   ├── MainArea
│   │   ├── ChatPane
│   │   │   ├── MessageList (虚拟滚动)
│   │   │   │   ├── UserMessage
│   │   │   │   ├── AssistantMessage
│   │   │   │   │   ├── MarkdownBlock
│   │   │   │   │   ├── ThinkingBlock (折叠)
│   │   │   │   │   ├── ToolCallCard (多种类型)
│   │   │   │   │   └── TodoListBlock
│   │   │   │   └── SystemEvent (权限、错误等)
│   │   │   └── ScrollToBottomButton
│   │   ├── Composer
│   │   │   ├── InputArea (textarea + @mention)
│   │   │   ├── ContextPills
│   │   │   ├── SkillQuickActions
│   │   │   └── SendButton + ModeToggles (Plan / Yolo)
│   │   └── DiffOverlay / FullDiffModal (可选浮层)
│   └── RightPane
│       ├── ArtifactsPanel
│       ├── DiffViewer
│       ├── SkillsPanel
│       ├── ContextInspector
│       └── TodoPanel
├── Modals
│   ├── ApprovalModal (最重要)
│   ├── SettingsModal
│   ├── FilePickerModal
│   └── SessionPickerModal
└── CommandPalette (⌘K)
```

---

## 3. 核心组件详细拆分

### 3.1 TopBar

**职责**：
- 显示当前项目路径（可点击切换）
- 模型切换器（下拉：grok-build-0.1, grok-4.3, ...）
- 连接状态指示器（已登录 Grok / API Key / 离线）
- 全局操作：新建会话、打开文件夹、设置、YOLO 开关
- 状态徽章：Plan Mode、当前活跃 subagents 数量

**关键交互**：
- 点击项目路径 → 弹出最近项目或文件选择器
- 模型切换即时生效（下次提示使用）

### 3.2 LeftSidebar

#### FileTree

**功能**：
- 虚拟化目录树（性能关键）
- 文件/文件夹图标 + 状态（modified by agent / git status）
- 右键菜单：Attach to context / Open in editor / Reveal in Finder
- 拖拽文件到 Composer 添加上下文
- 支持搜索过滤（debounce）

**数据来源**：
- 初始由 Tauri `fs.readDir` + 递归
- 监听文件变更（可选，使用 notify 或轮询）
- Grok 内部变更后前端刷新（通过 tool result 事件驱动）

#### SessionList

- 按时间或项目分组
- 显示会话标题（Grok 自动生成或第一条消息）
- 当前激活高亮
- 支持删除、导出、继续

### 3.3 ChatPane & MessageList

**核心渲染组件**：

#### UserMessage
- 右对齐或卡片样式
- 显示附加的上下文文件 pills
- 支持编辑后重新发送

#### AssistantMessage
- 包含：
  - 主要文本（Markdown）
  - `<thinking>` 区块（可折叠，默认收起，显示耗时）
  - 工具调用卡片列表（按时间顺序）
  - Todo 列表（如果有 `todo_write`）

#### ToolCallCard（高度重要）

根据 tool 不同展示不同形态：

| Tool 类型            | 卡片内容                              | 特殊交互                     |
|----------------------|---------------------------------------|------------------------------|
| read_file            | 文件路径 + 行范围 + 预览片段          | 点击跳转文件树               |
| search_replace       | 文件路径 + 旧/新 diff 预览（行内）    | 按钮 Apply / Reject / View Full |
| run_terminal_command | 命令 + 输出（可折叠）                 | 复制命令、重跑               |
| web_search / fetch   | 查询词 + 结果摘要                     | 打开链接                     |
| todo_write           | 任务列表（checkbox 状态）             | -                            |
| spawn_subagent       | 子代理 ID + 目标                      | 打开子代理视图（未来）       |

**实时状态**：
- `pending` → `running`（loading spinner） → `success` / `error`
- 重要：search_replace 卡片要展示漂亮的 unified diff

#### ThinkingBlock
- 默认折叠
- 标题显示 “Thinking · 1.2s”
- 展开后完整 reasoning 文本

### 3.4 Composer（输入核心）

**功能需求**：
- 多行文本输入（支持 Shift+Enter 换行）
- 实时 `@` 提及：
  - 输入 `@` 弹出文件模糊搜索（支持路径、文件名）
  - 支持 `@file:10-42` 语法
  - 已添加的文件以 Pills 形式展示（可删除）
- 技能快捷按钮栏（横向滚动）
- 模式切换：
  - Plan Mode toggle
  - YOLO / Auto-approve toggle（危险操作需二次确认）
- 发送时显示 token 估算（可选）
- 支持粘贴图片（未来视觉）

**灵感参考**：
- acks-ai-studio 的 Composer.jsx（有 SKILL_PRESETS 实现）
- Cursor / Claude 的 composer 设计

### 3.5 RightPane（上下文与成果）

可切换不同 Tab：

1. **Artifacts**
   - Grok 生成/修改的文件列表
   - 点击打开 Diff 或 Monaco 预览
   - 对 web 项目可提供简单 preview（iframe 或 external）

2. **Diff / Changes**
   - 当前会话所有未 apply 的变更聚合视图
   - “Apply All” / “Reject All” 按钮
   - 每个变更独立操作

3. **Skills**
   - 当前项目 + 用户 + repo 加载的 skills 列表
   - 搜索 + 描述
   - 点击 “Use Skill” 把对应指令注入 Composer

4. **Todos**
   - 实时显示 `todo_write` 创建的任务清单
   - 支持手动标记完成（同步回 Grok）

5. **Context Inspector**（高级）
   - 当前会话注入的全部文件列表 + token 估算

---

## 4. 关键 Modal

### ApprovalModal（最高优先级）

**设计要点**（参考 acks-ai-studio ApprovalModal）：

- 模态居中，半透明背景
- 清晰显示：
  - 操作类型（Shell / Write File / Edit / Web 等）
  - 具体命令或文件路径（monospace 高亮）
  - 触发原因 / 规则描述
- 四个主要按钮（颜色区分）：
  - **允许一次**（橙色）
  - **此会话内始终允许**（紫/蓝）
  - **始终允许**（绿色，带警告）
  - **拒绝**（红色）
- 可选备注输入
- “记住我的选择” + 全局规则链接

**额外**：
- 支持批量权限请求队列（如果同时多个）

### SettingsModal

- 认证管理
- 模型 & 默认参数
- 权限默认策略
- Skills 目录管理
- MCP 服务器列表（未来）
- 主题、键盘、行为偏好

---

## 5. 状态与数据模型（TypeScript 接口草稿）

```ts
// 核心类型
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  thinking?: string;
  timestamp: number;
};

type ToolExecution = {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input: any;
  output?: any;
  filePath?: string;
  diff?: string;           // unified diff
  startedAt: number;
  finishedAt?: number;
};

type ApprovalRequest = {
  id: string;
  tool: string;
  commandOrPath: string;
  description?: string;
  choices: ('once' | 'session' | 'always' | 'deny')[];
};

type Project = {
  path: string;
  name: string;
  gitRoot?: string;
  lastOpened: number;
};

type Settings = {
  model: string;
  useLocalCli: boolean;
  xaiApiKey?: string;      // 仅内存/密钥链
  autoApproveLevel: 'strict' | 'session' | 'yolo';
  // ...
};
```

---

## 6. 关键用户交互流程（组件协作）

### 流程：发送提示并处理工具 + 权限

1. `Composer` → `onSend(prompt, contextFiles)`
2. `useGrokSession` hook → 调用 Tauri `invoke('send_prompt', { prompt, sessionId })`
3. Rust Bridge 写入 ACP / stdin
4. 通过 `listen('grok-event')` 接收流事件
5. Zustand store 更新 `messages` / `toolExecutions`
6. `ChatPane` 重新渲染对应卡片
7. 如果事件是 `permission_request`：
   - store 设置 `pendingApproval`
   - `ApprovalModal` 出现
8. 用户点击批准 → `invoke('respond_to_approval', { choice })`
9. 后端转发给 grok 进程
10. 后续 tool result 事件到达 → 更新卡片状态 + 可能触发 `DiffViewer` 更新

---

## 7. 设计规范与细节

- **间距**：使用 Tailwind 标准（gap-2/3/4）
- **卡片样式**：圆角 8-12px，subtle border，hover 微弱提升
- **颜色语义**：
  - Success: emerald
  - Danger/Write: rose/red
  - Thinking: zinc/gray
  - Tool running: amber
- **字体**：
  - UI：系统 sans（-apple-system / Inter）
  - 代码 / Diff / 命令：JetBrains Mono 或系统等宽
- **动画**：轻量（Framer Motion），仅用于状态过渡，避免干扰
- **可访问性**：所有按钮有 aria-label；焦点管理良好

---

## 8. 复用现有代码建议

从 `acks-ai-studio/src/components/` 可以直接借鉴/迁移：

- `ApprovalModal.jsx` → 直接参考样式和逻辑
- `Composer.jsx` → SKILL_PRESETS 思路 + @ 提及实现
- `ArtifactsPanel.jsx` → RightPane 的 Artifacts tab
- `ChatPanel.jsx` → ChatPane 基础结构

建议在新项目中用 TypeScript 重写，并抽象成更通用的组件。

---

## 9. 未来组件演进方向（Phase 2）

- `InlineEditBubble`（类似 Cursor）
- `SymbolPicker`（@符号、函数、类型）
- `SubagentDashboard`
- `SkillEditor`（带实时预览）
- `TerminalPane`（完整终端模拟）
- `GitPanel`

---

## 10. 验收标准（组件级别）

- 所有消息类型（text / thought / 6+ 种 tool）都有对应视觉呈现
- 权限请求 100% 走 UI，不出现终端 prompt
- 大型项目（1000+ 文件）文件树仍流畅（虚拟滚动）
- 键盘操作覆盖率 > 80% 常用功能
- Diff apply 准确率 100%（以 Grok 返回为准）

---

**下一步**：
此文档将指导前端组件实现。建议先实现 Layout + ChatPane + Composer + ApprovalModal 的骨架。

文档会随实现反馈更新。
