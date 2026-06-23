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

## 快速开始（已准备好）

**只需一次** 安装 Rust，然后以后直接运行：

```bash
cd ~/groky
npm run tauri:dev
```

（如果新终端提示找不到 cargo，先执行一次 `source "$HOME/.cargo/env"`）

我已经把以下全部预先处理好：
- Tauri 2 配置 + 权限 + 插件声明
- Rust 端错误处理 + stderr 流 + 二进制查找
- 前端完整流式 + 错误展示 + 模拟模式降级
- 占位图标 + 脚本 + 能力文件

第一次会下载依赖 + 编译（几分钟），之后秒开。

想只看浏览器 UI（模拟）：
npm run dev

更多细节：docs/ 目录（PREREQUISITES.md, GETTING_STARTED.md）

第一次运行会：
- 启动 Vite 前端
- 通过 Cargo 编译 Rust 后端（Tauri）
- 打开 Groky 桌面应用（自动打开 DevTools）

**提示**：如果想先只看前端 UI，可以运行 `npm run dev`，不过后端调用会走模拟模式。
```

## 文档

- [PRD - 产品需求文档](./docs/PRD.md)
- [架构方案](./docs/ARCHITECTURE.md)
- [组件拆分与 UI 规范](./docs/COMPONENTS.md)
- [ROADMAP](./docs/ROADMAP.md)（待补充）

## 当前状态

- 概念验证阶段
- 详细 PRD + 架构 + 组件拆分已完成
- 即将开始技术脚手架

## 相关

- Grok Build CLI: `grok` (xAI 官方)
- 灵感来源：Claude Code、Cursor、Aider、Continue.dev
- 用户已有类似经验：acks-ai-studio（Electron + React 聊天/Artifacts/Approval 组件）

---

**项目负责人**：用户（taojin） + Grok AI 协作构建

欢迎贡献想法和代码。
