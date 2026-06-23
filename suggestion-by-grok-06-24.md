# Groky 项目建议与意见 — Grok 提出

**日期**：2026-06-24  
**作者**：Grok  
**上下文**：基于当前实现（headless streaming-json 为主）、PRD v0.1、ARCHITECTURE.md、ROADMAP.md、COMPONENTS.md 的综合评审

---

## 1. 总体评价

当前项目进展良好：
- Phase 1 骨架基本可用：布局、流式聊天、Composer、简单文件树、模型检测、设置等已落地。
- Rust 端进程管理、事件流、stdin 回写机制实现清晰。
- Zustand store + 事件解析逻辑比较健壮。
- UI 视觉风格与 Grok 调性一致，暗色主题、动画、卡片设计已到位。

**主要风险点**：
- 严重依赖 headless 模式，核心 ACP 能力尚未落地（权限模型、完整 tool 生命周期、session 管理等）。
- Diff 的“Apply”目前只改 UI 状态，**没有真正写回文件系统**。
- 权限交互在 headless 下是近似模拟，真实 ACP 下的 permission/request 流程需要重新设计。
- 部分架构承诺（如让 Grok CLI 作为单一真相源）还未完全体现。

---

## 2. 最高优先级建议（建议立即处理）

### 2.1 启动 ACP 客户端原型（最重要）

**当前状态**：完全走 `grok -p --output-format streaming-json`，是临时方案。

**建议**：
1. 在 `src-tauri/src/grok/` 下尽快建立模块：
   - `mod.rs`
   - `acp_client.rs`（双向 JSON-RPC over stdio）
   - `headless.rs`（保留作为 fallback）
   - `process.rs`（统一进程生命周期）
2. 定义统一的 `GrokClient` trait：
   - `start_session(...)`
   - `send_prompt(...)` → 返回 Stream<Event>
   - `respond_permission(id, decision)`
   - `close()`
3. 先实现最小可用的 ACP 消息：
   - `session/create`
   - `session/prompt`
   - 接收 `text` / `thought` / `tool_call` / `tool_result` / `permission/request`
4. 明确策略：MVP 主推 ACP，headless 仅作为无 `--agent` 或老版本降级。

**理由**：只有 ACP 才能拿到完整权限请求、子任务、精确的 tool 生命周期。

### 2.2 修复 Diff Apply 真实生效路径

**当前问题**：
- `DiffView` + `resolveDiff` 仅更新 store 状态。
- 没有调用 `search_replace` 工具实际修改文件，也没有让 Grok CLI 完成修改。

**推荐做法**（按优先级）：
- **最佳**：当用户点击 Accept 时，通过 ACP（或当前 stdin）回复确认，让 Grok 自己执行 `search_replace` 并返回结果。
- **备选**：在 Rust 端实现受控的 `apply_diff` 命令，但必须经过用户明确授权 + 记录日志。
- 禁止前端直接用 `fs.write` 修改项目文件（违背“单一真相源”原则）。

同时建议在 `PendingDiff` 中增加：
- `toolUseId`
- `originalToolCallId`
- 是否已同步回 Grok 的标志

### 2.3 权限系统重构

当前 `ApprovalModal` + `reply_to_grok('y'/'n')` 是对 headless 的 hack。

**建议**：
- 区分两种模式下的权限处理。
- ACP 模式下必须严格走 `permission/request` → `permission/response` 协议。
- 增加“全局规则”持久化（allow/deny list + 作用域：项目 / 全局 / 会话）。
- YOLO 模式应该在 Grok CLI 层面和 UI 层面双重体现，并给出明显视觉提示。

---

## 3. 重要但非阻塞的建议

### 3.1 更好的上下文注入（@file）

当前实现是前端正则抓 `@xxx` 后 `read_file_content` 然后拼接进 prompt。

**改进方向**：
- 支持 `@file:10-30` 语法（已在 PRD）。
- 支持目录 `@dir`（递归或摘要）。
- 支持符号级（函数名）引用（Phase 2+）。
- 把上下文文件作为结构化数据传给 Grok（而非全部塞进 prompt 文本），让 Grok 决定如何使用。
- 在 Composer 显示 Pills 并支持删除、编辑范围。

### 3.2 Session 管理对齐 Grok 真实 session

- 当前前端自己生成 sessionId 并用 `--resume`。
- 建议优先让 Grok CLI 返回真实的 `session_id`，前端只做缓存和 UI 展示。
- 历史会话列表最好能显示 Grok 自动总结的标题，而不是只截前 80 字。

### 3.3 工具渲染与 Todo 完善

- 增加对 `todo_write` 的专门渲染组件（漂亮的任务清单，支持进度）。
- `run_terminal_command` 应该把 stdout/stderr 结构化展示（可折叠 + 复制 + 重新运行）。
- ToolCard 需要支持更多类型（spawn_subagent、web 等）。
- 区分 “正在执行” 和 “已完成” 的视觉状态更清晰。

### 3.4 文件树体验升级（Phase 2 前必须）

- 当前实现已支持懒加载，但：
  - 缺少搜索 / 过滤
  - 缺少 git status 着色
  - 缺少右键菜单（Attach、Reveal in Finder、Copy Path）
  - 大项目性能仍需虚拟化（react-window / @tanstack/virtual）

### 3.5 错误处理与恢复

- Grok 进程异常退出时要优雅降级 + 提示用户。
- 增加重试按钮（对同一次 prompt 重发）。
- 网络 / 认证错误要给出具体修复指引（而不是只 console.warn）。
- 前端与后端事件丢失时要有明显提示。

---

## 4. 架构与代码质量建议

### 4.1 后端模块化

目前 `main.rs` 已经超过 370 行，命令和状态混在一起。

建议拆分：
```
src-tauri/src/
├── main.rs
├── grok/
│   ├── mod.rs
│   ├── client.rs          # trait + 工厂
│   ├── headless.rs
│   ├── acp.rs             # 待实现
│   └── process.rs
├── commands.rs            # 所有 tauri::command
├── fs.rs
├── permissions.rs
└── settings.rs
```

### 4.2 前端类型与事件模型

- `GrokEvent` 类型目前比较宽松（`type: string`）。建议定义完整的 Discriminated Union。
- 所有事件最好带 `timestamp`。
- 考虑引入 `toolExecutions` 独立于 `messages` 存储（便于右侧面板聚合展示）。

### 4.3 状态持久化策略

- API Key 当前存在 localStorage（不安全）。**必须**改用 Tauri 的 `keyring` 或 `tauri-plugin-store` + 系统钥匙串。
- 项目列表、最近会话可以 localStorage / tauri store。
- 长期：会话内容尽量不持久化在前端，由 Grok CLI 负责（`~/.grok/sessions`）。

### 4.4 主题与样式

- 颜色变量目前散落在 CSS。建议集中到 `src/styles.css` 或单独 theme 文件。
- 考虑支持 accent color 自定义（Grok 风格的橙紫）。

---

## 5. 功能与产品建议

| 领域           | 建议内容                                      | 优先级 | 阶段     |
|----------------|-----------------------------------------------|--------|----------|
| Skills         | 右侧 Extensions 面板至少展示可用 Skills + 一键触发 | 高     | Phase 2  |
| Command Palette| ⌘K 实现常用操作（New Session / Switch Model / Compact 等） | 中     | Phase 2  |
| Artifacts      | 右侧增加简单预览（Markdown、图片、简单 HTML）       | 中     | Phase 3  |
| 键盘优先       | 全面补充快捷键文档 + 实现 Tab / Esc / ↑↓ 导航       | 中     | Phase 2  |
| 多模态         | 先支持粘贴图片作为上下文（即使模型不支持也先占位）   | 低     | Phase 4+ |
| MCP 可视化     | 在 Extensions 里展示已连接的 MCP 状态               | 低     | Phase 4  |

---

## 6. 安全与合规

- 所有写文件操作必须经过用户显式确认（已部分实现）。
- `--always-approve` / YOLO 模式必须有强烈视觉警告 + 易于退出机制。
- Rust 端绝不能信任前端传来的任意路径做写操作。
- 考虑支持 `--sandbox` 参数透传。

---

## 7. 开发与测试建议

- 增加 E2E 验证脚本：启动 → 打开项目 → 发送 prompt → 看到工具卡片 → 看到 diff。
- 对 `parse_grok_line` 增加单元测试（Rust）。
- 前端增加 Storybook 或简单的 mock 模式开关（已部分存在 demo ribbon，可加强）。
- 记录真实的 `grok` CLI 输出样本，用于回归测试事件解析器。

---

## 8. 下一步行动建议（推荐顺序）

1. **本周**：完成 ACP 最小原型 + 切换开关（headless / acp）。
2. **本周/下周**：修复 Diff Apply 真实生效（通过 Grok 执行）。
3. 完善权限真实协议对接。
4. 加强文件树（搜索 + git status + 右键）。
5. 实现 Skills 快速触发入口。
6. 命令面板 + 更多键盘快捷键。
7. 进入 Phase 2 验收：完成一次真实的重构任务（含权限 + diff + apply）。

---

## 附录：与文档的偏差记录

- ARCHITECTURE.md 中规划的目录结构 `src-tauri/src/grok/acp_client.rs` 等尚未创建。
- PRD 中提到的“完整工具事件渲染”在视觉上已较好，但部分事件（尤其是 permission）解析仍依赖原始 JSON。
- ROADMAP Phase 1 很多条目已完成，Phase 2 的 ACP 项仍是空白。

---

**结语**：

当前项目已经有了非常好的可用原型。接下来 1-2 周如果能把 ACP 打通 + Diff 真正可 Apply + 权限流程可靠，整个体验会产生质的飞跃。

随时可以继续迭代这个建议文档，或针对某个具体模块深入讨论实现方案。

— Grok (2026-06-24)
