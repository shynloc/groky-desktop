# Groky 开发路线图

**最后更新**：2026-06-25  
**当前版本**：v0.1.0

---

## Phase 0: 规划 ✅

- [x] PRD v0.1
- [x] 架构方案
- [x] 组件拆分
- [x] 项目目录初始化

## Phase 1: 基础骨架 ✅

**目标**：能打开项目、发送提示、看到流式回复和基础工具反馈

- [x] Tauri 2 项目初始化 + React 19 + TS + Vite
- [x] 基础 Layout（TopBar + IconDock + 三栏）
- [x] Settings 页面 + 检测本地 grok CLI + 认证状态（Grok 订阅 / API Key）
- [x] 实现 GrokClient（headless streaming-json，`grok -p --output-format streaming-json`）
- [x] Composer 基础输入 + 发送 + effort 选择器
- [x] ChatPane 实时流式渲染（文本 + thinking + tool call）
- [x] 文件树（虚拟化 + 折叠 + 路径安全限制）
- [x] Session 基础管理（新会话、恢复、历史列表）
- [x] ApprovalModal 权限审批（2x2 网格 + 危险命令检测）
- [x] DiffView 可视化（行号 + Accept 写文件 / Reject）
- [x] 会话 ID 回写 + 历史保存
- [x] 设置统一持久化（tauri-plugin-store）
- [x] 浏览器模拟模式降级（npm run dev）
- [x] i18n（中/英文）
- [x] 主题（深色/浅色）
- [x] ErrorBoundary
- [x] 34 个单元测试

## Phase 2: Agent 体验核心 🔄 部分完成

- [ ] 升级到 ACP 客户端（`grok agent stdio`，双向 JSON-RPC）
- [x] ToolCallCard 完整实现（read_file / search_replace / grep / terminal / web 等）
- [x] ApprovalModal 功能打通（权限请求 → 用户选择 → stdin 回传 grok）
- [x] Context Pills + @file 引用（文件选择对话框）
- [x] Apply / Reject 变更流程（单文件 apply_diff 写入磁盘）
- [ ] 批量 Apply / Reject（会话级别）
- [ ] todo_write 实时任务列表渲染
- [ ] 消息复制 / 重新发送 / 编辑后重发
- [ ] 多轮对话上下文压缩提示
- [ ] 错误处理与重试 UI

## Phase 3: Work 模式 ✅ UI 骨架完成

**目标**：设计稿中的 6 个 Work 子视图全部有 UI 实现

- [x] IconDock 切换 Work/Build 模式
- [x] Sidebar 根据 workView 条件渲染
- [x] 主区域根据 workView 条件渲染
- [x] 右侧面板根据 workView 条件渲染
- [x] Chat 视图：最近对话 sidebar + Session 信息右面板
- [x] Docs 视图：文档分析 + Key Insights + Action Items
- [x] Image 视图：图片生成网格 + style/ratio 控制
- [x] Voice 视图：音频播放器 + 波形 + 转录 + AI 总结
- [x] Projects 视图：看板式任务列表 + Sprint 进度
- [x] Research 视图：搜索结果 + 来源卡片 + 报告生成

> **注意**：Work 模式当前为 UI 静态展示（设计稿还原），尚未接入真实数据源。需要后续接入 Grok API / Skills 实现真正的文档分析、图片生成、语音转录等功能。

## Phase 4: 生产力打磨 ⬜ 待开始

- [ ] Command Palette 扩展（更多命令、搜索过滤）
- [ ] 键盘快捷键全面覆盖
- [ ] 会话导出（Markdown）
- [ ] 会话历史搜索
- [ ] 文件树搜索过滤（debounce）
- [ ] 右键菜单（Attach to context / Open in editor / Reveal in Finder）
- [ ] 拖拽文件到 Composer 添加上下文
- [ ] 性能优化（大项目文件树、长会话）
- [ ] StatusBar（当前模式、权限规则数、grok 版本、token 用量）

## Phase 5: 架构升级 ⬜ 待开始

- [ ] ACP 客户端实现（`grok agent stdio`，双向 JSON-RPC over stdio）
- [ ] Rust 后端模块拆分（commands.rs / grok/ / fs.rs / settings.rs）
- [ ] Direct xAI API 备选模式
- [ ] GrokClient trait 统一抽象（ACP / Headless / Direct API 策略模式）
- [ ] 进程健康监控 + 自动重启

## Phase 6: 高级特性 & 发布 ⬜ 待开始

- [ ] Skills 面板（发现 + 触发 + 只读预览）
- [ ] MCP 服务器配置 UI
- [ ] Skill 创建/编辑基础支持
- [ ] 打包（.dmg）、签名、自动更新
- [ ] 用户引导 + 空状态设计
- [ ] 文档 + 示例项目
- [ ] Beta 用户反馈循环

## 长期路线（Phase 7+）

- 内联编辑与 Cursor 式快速操作
- 多模态（图像、图表预览）
- 团队 Skills 管理
- VSCode / Zed 插件形态
- 插件系统
- 云同步（可选）
- 终端集成面板（完整终端模拟）
- Windows / Linux 支持
