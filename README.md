# Groky

**Groky** 是 Grok Build（Grok CLI）的桌面 GUI 客户端。让强大的 Grok agentic coding 能力拥有现代化的可视化体验。

## 定位

- Grok Build 的**图形界面伴侣**
- 融合 **Claude Code** 的干净体验 + **Cursor** 的项目感知与快速迭代
- 充分发挥 Grok Build 的优势：Skills 系统、Subagents、MCP、企业工具集成（飞书/企微等）

## 核心理念

- 尊重并复用 Grok CLI 的全部能力（不要重复造 agent 轮子）
- 原生桌面体验（轻量、安全、键盘优先）
- 可视化 agent 过程（思考、工具、diff、权限）
- 技能与权限的一等公民体验

## 快速开始

```bash
cd ~/groky
npm install
npm run tauri:dev    # 桌面应用（需要 Rust + grok CLI）
npm run dev          # 浏览器预览（模拟模式）
```

前置条件：安装 Rust（`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`）和 Grok CLI（`~/.grok/bin`）。

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2 |
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS + 手写 CSS 变量 |
| 状态管理 | Zustand（3 个 store：chat/session/settings） |
| 渲染 | react-markdown + remark-gfm + framer-motion |
| 图标 | Lucide React |
| 后端 | Rust + Tokio 异步 + tauri-plugin-shell/dialog/store |
| 集成模式 | Headless streaming-json（`grok -p --output-format streaming-json`） |

## 功能状态

### 已完成

**Build 模式（编码助手）**
- 流式聊天：文本 + thinking 块（可折叠）+ tool call 卡片（running/success/error）
- Diff 可视化：行号 + +/- 行对比 + Accept（写入文件）/ Reject
- 权限审批：2x2 网格弹窗（Allow once / Allow session / Always / Deny）+ 危险命令检测
- 文件树：可折叠目录 + 虚拟化（>100 项）+ 路径安全限制
- 会话管理：新建 / 恢复 / 历史列表（localStorage 持久化）
- Composer：@file 引用 + effort 选择器 + 文件选择对话框
- 右侧面板：Context / Diff / Extensions / Commands / Settings 五标签
- Command Palette（⌘K）
- Project Picker
- 设置：Grok 订阅 / API Key 认证 + 模型选择 + 主题 + 语言（中/英）
- YOLO 模式快速切换
- 所有设置通过 tauri-plugin-store 持久化

**Work 模式（通用工作台）**
- Chat：复用 Build 聊天 + 最近对话 sidebar + Session 信息右侧面板
- Docs：文档分析（Key Insights + Action Items）+ 文档列表 sidebar + 文档信息右面板
- Image：图片生成网格（style/ratio 控制）+ 图片缩略图 sidebar + 样式面板
- Voice：音频播放器 + 波形 + 转录 + AI 总结 + 录音列表 sidebar + 行动项面板
- Projects：看板式任务列表（In Progress/To Do/Done）+ 项目列表 sidebar + Sprint 进度面板
- Research：搜索结果 + 来源卡片 + 报告生成 + 搜索历史 sidebar + 报告面板

**安全**
- read_file_content：路径遍历防护 + 敏感文件精确过滤（.ssh/.gnupg/.aws + .env 等）
- list_directory：project_path 限制
- apply_diff：写入前路径校验
- 输入日志：危险模式检测（$(`, `` ` ``, `${`）

**测试**
- 34 个单元测试（stores + typeValidation）
- TypeScript 严格模式

### 待开发

详见 [ROADMAP.md](./docs/ROADMAP.md)。

## 目录结构

```
groky/
├── src-tauri/                    # Rust 后端
│   ├── src/main.rs               # Tauri 命令（6 个 invoke handler）
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # React 前端
│   ├── components/
│   │   ├── work/                 # Work 模式 6 个子视图
│   │   │   ├── DocsView.tsx
│   │   │   ├── ImageView.tsx
│   │   │   ├── VoiceView.tsx
│   │   │   ├── ProjectsView.tsx
│   │   │   ├── ResearchView.tsx
│   │   │   └── WorkChatSidebar.tsx
│   │   ├── App.tsx               # 主应用（条件渲染 Build/Work）
│   │   ├── ChatPane.tsx          # 消息列表（虚拟化）
│   │   ├── Composer.tsx          # 输入框
│   │   ├── MessageItem.tsx       # 单条消息（Markdown + thinking + tool）
│   │   ├── ToolCard.tsx          # 工具调用卡片
│   │   ├── ApprovalModal.tsx     # 权限审批弹窗
│   │   ├── DiffView.tsx          # Diff 可视化
│   │   ├── FileTree.tsx          # 文件树（虚拟化）
│   │   ├── IconDock.tsx          # 左侧图标栏
│   │   ├── TopBar.tsx            # 顶部栏
│   │   ├── WelcomeScreen.tsx     # 欢迎页
│   │   ├── CommandPalette.tsx    # 命令面板
│   │   ├── ProjectPicker.tsx     # 项目选择器
│   │   └── SuggestedPrompts.tsx  # 建议提示
│   ├── stores/
│   │   ├── chatStore.ts          # 消息 + 流式 + 审批 + diff
│   │   ├── sessionStore.ts       # 项目 + 会话
│   │   ├── settingsStore.ts      # 设置（统一持久化）
│   │   └── appStore.ts           # 组合 store hook
│   ├── services/
│   │   ├── secureStore.ts        # API Key + 设置持久化
│   │   └── typeValidation.ts     # Zod schema 验证
│   ├── types.ts                  # 核心类型定义
│   ├── constants.ts              # 模型列表
│   ├── constants/config.ts       # 配置常量
│   ├── i18n.ts                   # 中英文翻译
│   └── styles.css                # 全局样式（~3500 行）
├── docs/                         # 文档
└── package.json
```

## 文档

- [PRD - 产品需求文档](./docs/PRD.md)
- [架构方案](./docs/ARCHITECTURE.md)
- [组件拆分与 UI 规范](./docs/COMPONENTS.md)
- [开发路线图](./docs/ROADMAP.md)

## 相关

- Grok Build CLI: `grok` (xAI 官方)
- 灵感来源：Claude Code、Cursor、Aider、Continue.dev

---

**项目负责人**：用户（taojin） + Grok AI 协作构建
