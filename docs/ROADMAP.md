# Groky 开发路线图

## Phase 0: 规划（已完成）
- [x] PRD v0.1
- [x] 架构方案
- [x] 组件拆分
- [x] 项目目录初始化

## Phase 1: 基础骨架（目标 1-2 周）

**目标**：能打开项目、发送提示、看到流式回复和基础工具反馈

- [ ] Tauri 2 项目初始化 + React + TS + Tailwind
- [ ] 基础 Layout（TopBar + 三栏）
- [ ] Settings 页面 + 检测本地 grok CLI + 认证状态
- [ ] 实现最简 GrokClient（先用 headless streaming-json）
- [ ] Composer 基础输入 + 发送
- [ ] ChatPane 实时流式渲染（纯文本 + thinking）
- [ ] 简单文件树（静态）
- [ ] Session 基础管理（新会话、列表）
- [ ] 基础权限提示（占位）

**里程碑**：能用 Groky 完成一次“分析当前目录结构”的简单任务

## Phase 2: Agent 体验核心（目标 2-3 周）

- [ ] 升级到 ACP 客户端（或并行）
- [ ] 完整 ToolCallCard 实现（尤其是 search_replace diff）
- [ ] ApprovalModal 功能打通（权限请求 → 用户选择 → 回传）
- [ ] Context Pills + @file 提及（文件树联动）
- [ ] Apply / Reject 变更流程（单文件 + 批量）
- [ ] 实时 TodoList 显示
- [ ] 错误处理与重试

**里程碑**：完成一次真实的重构任务（含权限 + diff + apply）

## Phase 3: 生产力打磨（目标 2 周）

- [ ] 虚拟化文件树 + 搜索
- [ ] 右侧 Artifacts + Diff 面板
- [ ] Skills 面板（发现 + 触发）
- [ ] Command Palette（⌘K）
- [ ] 键盘快捷键全面覆盖
- [ ] 会话导出 + 历史搜索
- [ ] 性能优化（大项目）
- [ ] 主题 + 外观 polish

**里程碑**：日常 coding 体验优于纯 TUI

## Phase 4: 高级特性 & 发布（目标 3-4 周）

- [ ] 完整 ACP 稳定支持 + 版本兼容
- [ ] Direct xAI API 备选模式
- [ ] Skill 创建/编辑基础支持
- [ ] MCP 服务器配置 UI
- [ ] 打包（.dmg）、签名、自动更新
- [ ] 用户引导 + 空状态设计
- [ ] 文档 + 示例项目
- [ ] Beta 用户反馈循环

## 长期路线（Phase 5+）

- 内联编辑与 Cursor 式快速操作
- 多模态（图像、图表）
- 团队 Skills 管理
- VSCode / Zed 插件形态
- 插件系统
- 云同步（可选）

---

**当前优先级**：尽快完成 Phase 1 闭环，验证 ACP / headless 集成可行性。

更新时间：2026-06-23
