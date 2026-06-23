# Groky 产品需求文档 (PRD)

**版本**：v0.1 (2026-06-23)  
**状态**：草案 / 待评审  
**负责人**：用户 + Grok AI 协作  
**目标发布**：MVP 在 4-8 周内可日常使用

---

## 1. 执行摘要 / Vision

**Groky** 是一个原生桌面 GUI 客户端，专为 **Grok Build**（xAI 官方的 Grok CLI coding agent）设计。

**一句话定位**：
> 让 Grok Build 拥有像 Cursor / Claude Code 一样丝滑的图形界面，同时完整保留其 Skills、Subagents、MCP 和企业工具生态的优势。

**愿景**：
成为中文开发者（以及重视 agentic coding + 工具集成场景）首选的 Grok 桌面工作台。

---

## 2. 背景与机会

### 2.1 市场背景
- 2026 年 5 月 xAI 正式发布 **Grok Build** CLI，作为 Claude Code 的直接竞品。
- Grok Build 已在技术能力上展现极强潜力（尤其是 grok-build-0.1 编码专用模型 + 成熟的 agent 循环）。
- 当前主要使用方式仍是终端 TUI，存在明显体验鸿沟：
  - 可视化 diff 差
  - 工具执行过程难以回顾和理解
  - 多文件上下文管理不直观
  - 权限确认体验原始
  - 难以同时查看代码和对话

### 2.2 用户已有基础
- 用户已深度使用 Grok Build CLI（含大量自定义 skills）
- 在 `acks-ai-studio` 项目中已积累大量相关 UI 组件：
  - ChatPanel、Composer、ArtifactsPanel
  - ApprovalModal（权限确认）
  - MasterTaskList 等
- 用户熟悉 Electron / React / JSX 栈，同时对现代桌面方案（Tauri）持开放态度。

### 2.3 机会点
- Grok Build 提供**现成**的强大 agent 后端（`grok agent stdio` ACP 协议），无需从零实现工具循环。
- 中文企业工具生态（飞书 Lark、企微 WeCom、腾讯文档等）在 Grok skills 中已高度成熟，GUI 可以把这些能力可视化并易用化。
- 当前市场桌面 AI coding 客户端以 Cursor（OpenAI/Anthropic 为主）为主，Grok 专用客户端几乎空白。

---

## 3. 目标用户

**Primary（核心）**：
- 专业软件工程师 / 全栈开发者（重度使用 CLI  coding agent 的用户）
- 已经或愿意使用 Grok Build / SuperGrok / xAI API 的开发者

**Secondary**：
- 团队技术负责人（希望用 Skills 标准化流程）
- 使用飞书/企微进行项目管理的中文团队开发者
- 喜欢强可视化反馈、讨厌纯终端的用户

**Persona 示例**：
- “小明”：每天用 `grok` 做重构、写测试、review PR，希望能用鼠标快速 review diff、并行看多个文件。

---

## 4. 核心价值主张

| 维度           | 当前 Grok CLI (TUI)          | Groky (GUI)                          | 价值提升                  |
|----------------|------------------------------|--------------------------------------|---------------------------|
| 信息密度       | 高，但线性                   | 高 + 并行视觉                        | 更快理解 agent 行为       |
| Diff 审查      | 终端文本                     | 语法高亮 + 行内对比 + 一键 apply     | 大幅降低出错风险          |
| 上下文管理     | @file + 模糊搜索             | 文件树 + 多选 + 符号搜索 + Pills     | 更精准、更快              |
| 权限控制       | 终端 Y/N                     | 漂亮弹窗 + 规则管理 + 历史回顾       | 安全感 + 可控性           |
| Skills 使用    | 隐式激活                     | 显式面板 + 快捷触发 + 管理           | 充分发挥 Grok 差异化优势  |
| 多任务         | 难并行                       | Subagent 可视 + 多个 Artifacts       | 生产力                    |
| 学习成本       | 终端党友好                   | 图形化 + 键盘优先                    | 更广用户群                |

---

## 5. MVP 范围（Phase 1）

### 5.1 必须包含 (Must Have)

**项目与工作区**
- 打开本地文件夹（支持 git root 自动识别）
- 文件树（支持 .gitignore、搜索）
- 最近项目列表

**认证与设置**
- 自动检测 `~/.grok/auth.json`（Grok 订阅登录）
- 支持手动输入 `XAI_API_KEY`
- 模型选择（grok-build-0.1 / grok-4.3 等）
- 基础配置（yolo 模式、权限策略、sandbox profile）

**聊天与 Agent 交互**
- 实时流式聊天界面
- 支持 `@file`、 `@dir`、粘贴代码片段
- 完整渲染 Grok 的输出：
  - 普通文本 + Markdown
  - Thinking blocks（可折叠）
  - Tool calls（实时状态：running / success / error）
  - search_replace diff 可视化
  - todo_write 任务列表

**权限系统（核心体验）**
- 当 Grok 请求权限时弹出 ApprovalModal
- 选项：允许一次 / 本会话始终允许 / 始终允许 / 拒绝
- 全局权限规则管理（简单版）

**文件与变更**
- 变更预览（单文件 diff）
- 一键 Apply / Reject 单个变更
- 批量 Apply（会话级别）

**会话管理**
- 新会话 / 继续最近会话 / 恢复指定 sessionId
- 会话列表（按项目或全局）
- 基础导出（Markdown）

**键盘与可用性**
- 继承 Grok TUI 常用快捷键 + 扩展桌面快捷
- Command Palette（⌘K 或 ⌘⇧P）
- Composer 强输入体验

### 5.2 Phase 1 不包含（明确排除）

- 内联代码编辑（Cursor 式 Tab 补全、@ 符号精确编辑）
- 图像生成 / 视觉能力（后续）
- 完整的 Skills 编辑器（先做只读 + 触发）
- 多项目同时打开（tab 形式）
- 云端协作 / 团队空间
- 完整终端模拟器（先用 Grok 的 run_terminal_command 展示）
- Windows / Linux 首要支持（先 macOS）

### 5.3 Nice to have（MVP 争取）

- 右侧 Artifacts 面板（渲染生成的文件、预览 web 页面）
- 技能快捷预设（类似之前 acks-ai-studio 的 SKILL_PRESETS）
- 简单的代码搜索（基于 ripgrep）

---

## 6. 功能需求详细列表（Functional Requirements）

### FR-01 项目管理
- FR-01-01 打开任意文件夹作为工作区
- FR-01-02 自动检测项目根（.git）
- FR-01-03 保存最近打开项目列表（本地）

### FR-02 认证与连接
- FR-02-01 优先使用本地 Grok CLI 认证
- FR-02-02 支持独立 XAI_API_KEY（直接 API 模式）
- FR-02-03 连接状态指示 + 重新认证入口

### FR-03 聊天核心
- FR-03-01 实时流式接收（ACP 或 streaming-json）
- FR-03-02 完整工具事件渲染
- FR-03-03 支持多轮对话 + 上下文压缩提示
- FR-03-04 消息可复制、重新发送、编辑后重发

### FR-04 上下文选择
- FR-04-01 文件树点击添加上下文
- FR-04-02 Composer 内 `@` 模糊搜索文件
- FR-04-03 支持选中行范围（@file:10-30）

### FR-05 权限与安全
- FR-05-01 工具执行前权限请求 UI
- FR-05-02 支持三种持久化级别
- FR-05-03 提供“当前会话权限概览”

### FR-06 变更应用
- FR-06-01 Diff 可视化（类似 GitHub）
- FR-06-02 单文件 / 批量接受变更
- FR-06-03 变更历史（会话内）

### FR-07 Skills 体验（MVP 部分）
- FR-07-01 发现当前可用的 Skills
- FR-07-02 手动触发特定 Skill
- FR-07-03 Skills 影响提示词的可见性

---

## 7. 非功能需求

- **性能**：启动 < 3s；单次提示响应首字 < 1s（取决于模型）；工具事件实时更新
- **可靠性**：崩溃不丢失未保存变更；优雅处理 grok 进程退出
- **安全性**：
  - 所有文件操作通过 Grok CLI（或 Tauri 受控接口）
  - API Key 使用系统密钥链存储
  - 权限默认 deny + 明确确认
- **跨平台**：优先 macOS，后续 Windows/Linux
- **可扩展**：前端组件化；后端可切换集成模式（ACP / Headless / Direct API）
- **可访问性**：键盘全程可操作；高对比度支持

---

## 8. 主要用户流程

### 流程 1：第一次打开项目并开始工作
1. 启动 Groky → 自动检测本地 Grok 认证
2. 打开文件夹（或最近项目）
3. 在 Composer 输入 “重构这个模块的认证逻辑，使用 TypeScript”
4. 看到 Thinking → Tool calls（grep、read_file）实时出现
5. 出现 search_replace 提议 → 右侧或下方展示漂亮 diff
6. 用户审查后点击 “Apply Changes”
7. 继续对话或请求 run test

### 流程 2：权限请求
1. Grok 想执行 `npm install` 或删除文件
2. 弹出模态 ApprovalModal
3. 用户选择 “此会话内始终允许” + 备注
4. 后续类似操作自动通过，历史记录可追溯

### 流程 3：使用 Skill
1. 输入 `/` 或点击技能按钮
2. 选择 “review-pr” skill
3. Groky 自动注入该 skill 的 prompt 模板 + 上下文
4. 执行标准 review 流程

---

## 9. 成功指标（MVP 后衡量）

- 日活跃用户中 60%+ 每天使用超过 30 分钟
- 平均每次会话中 apply 变更次数 > 5
- 权限拒绝率 < 15%（说明用户信任系统）
- 用户主动创建/使用自定义 Skills 的比例
- NPS 或定性反馈：“比纯 TUI 快 2 倍以上”

---

## 10. 约束与假设

**假设**：
- 用户机器上已安装 Grok CLI（或愿意安装）
- 大部分用户会使用本地 Grok 订阅认证（而非只用 API Key）
- ACP 协议稳定可用且文档足够（或可通过逆向/实验获得）

**约束**：
- 必须复用 Grok CLI 的 agent 能力，不能自己实现完整 tool calling 循环（避免重复工作且保持一致性）
- 初期不支持远程执行（agent 始终在用户本地机器运行）
- 资源占用要合理（Tauri 优势）

---

## 11. 风险与缓解

| 风险                           | 影响 | 缓解措施                                   |
|--------------------------------|------|--------------------------------------------|
| ACP 协议不成熟或变化快         | 高   | 同时支持 headless streaming-json 作为备选 |
| Grok CLI 更新破坏集成          | 中   | 版本检测 + 兼容层；提供“使用 Direct API”模式 |
| 权限模型复杂导致用户困惑       | 中   | 极致简化的默认策略 + 清晰的说明 + “YOLO”模式 |
| 性能（大项目文件树、长上下文） | 中   | 虚拟列表 + 延迟加载 + 让 Grok 自己处理索引 |

---

## 12. 后续阶段（Phase 2+ 方向）

- 内联编辑与快速 apply（类似 Cursor）
- 完整 Skill 创建/编辑器
- 多模态支持（图像、图表预览）
- 终端集成面板
- 团队 Skills 同步
- 插件 / MCP 可视化配置
- 云端会话同步（可选）
- VSCode / Zed 插件形态（作为补充）

---

**附录**：
- Grok Build 文档参考：`~/.grok/docs/user-guide/`
- ACP 协议：https://agentclientprotocol.com
- xAI API：https://docs.x.ai

---

*本 PRD 将随实际开发持续迭代。*
