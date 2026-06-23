# Groky 开发入门指南

## 1. 环境准备

**最常见错误**：`failed to run 'cargo metadata' ... No such file or directory`

→ 这说明 **Rust 还没安装**。请先看 [PREREQUISITES.md](./PREREQUISITES.md)

### 必须安装
- **Rust + Cargo**（最重要）
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source "$HOME/.cargo/env"
  cargo --version
  ```
- Node.js 20+ + npm（你已经有了）
- Grok Build CLI（必须）
  ```bash
  grok --version
  ```

### macOS 额外依赖
```bash
xcode-select --install
```

### 推荐工具
- VSCode + rust-analyzer 扩展
- 现代终端

### 快速验证
```bash
which cargo
cargo --version
which grok
grok --version
```

## 2. 启动开发

```bash
cd groky

# 安装前端依赖
pnpm install   # 或 npm install

# 启动 Tauri 开发模式（会同时启动 Vite + Rust）
cargo tauri dev
```

首次运行会：
- 编译 Rust
- 启动 Webview
- 你可以在 UI 中打开项目并测试

## 3. 关键开发命令

```bash
# 仅前端开发（HMR）
pnpm dev

# 只构建前端
pnpm build

# 生产构建
cargo tauri build

# 运行测试（后续补充）
cargo test
pnpm test
```

## 4. 调试 Grok 集成

### 查看 grok 原始输出
在 Rust Bridge 中增加 debug 日志，或临时用：

```bash
grok -p "test prompt" --output-format streaming-json --cwd /path/to/project 2>&1 | head -100
```

### 切换集成模式
在 Settings 中提供开关：
- "Use Grok CLI (recommended)"
- "Direct xAI API (lightweight)"

### 开发者模式
设置中开启 “Show raw events” 可以看到所有从 Grok 收到的 JSON。

## 5. 目录快速导航

- `src-tauri/src/grok/` — 所有与 Grok 通信的代码（最重要）
- `src/components/chat/` — 消息和工具渲染
- `src/components/composer/` — 输入核心
- `src/stores/` — 全局状态
- `src-tauri/src/commands.rs` — 前端可调用的 Tauri 命令

## 6. 第一个可验证的端到端流程（Phase 1 目标）

1. 打开 Groky
2. 打开一个有代码的文件夹
3. 在 Composer 输入：`列出项目的主要文件结构并总结用途`
4. 看到流式文字 + `list_dir` / `grep` 工具卡片
5. 成功渲染

## 7. 常见问题

**Q: grok 命令找不到？**  
A: 确保 `~/.grok/bin` 在 PATH，或在设置中手动指定路径。

**Q: 权限弹窗没出现？**  
A: 当前可能还在用 headless 模式。需要实现 ACP 才能完整拿到 permission_request 事件。

**Q: 想先快速验证 UI，不连 Grok？**  
A: 可以先 mock 一段 streaming JSON 事件来渲染 UI。

## 8. 下一步

阅读：
- `PRD.md`
- `ARCHITECTURE.md`
- `COMPONENTS.md`
- `ROADMAP.md`

然后开始 Phase 1 实施。

有任何问题随时问我（Grok）。
