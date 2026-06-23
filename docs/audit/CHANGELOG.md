# Groky 代码改动记录

**项目**: Groky Desktop  
**GitHub**: https://github.com/shynloc/groky-desktop  
**维护者**: AI Agent  
**最后更新**: 2026-06-24  

---

## 📋 改动记录说明

本文档记录所有代码改动，遵循以下格式：

```
## [版本号] - YYYY-MM-DD

### 类型 (emoji)
- 🔒 安全修复
- 🐛 Bug 修复
- ✨ 新功能
- ♻️ 重构
- 📝 文档
- 🎨 样式
- ⚡ 性能
- ✅ 测试
- 🔧 配置
- 📦 依赖

### 改动文件
- 文件路径: 改动说明

### 关联待办
- [TODO-XXX] 待办事项链接

### 提交信息
- commit hash: 提交信息

### 备注
- 补充说明
```

---

## [0.1.1] - 2026-06-24

### 📝 文档

**改动文件**:
- `docs/audit/README.md`: 创建审计文档目录说明
- `docs/audit/AUDIT_REPORT.md`: 创建完整审计报告
- `docs/audit/TODO.md`: 创建待办事项跟踪清单
- `docs/audit/CHANGELOG.md`: 创建代码改动记录（本文件）

**关联待办**:
- 无（文档初始化）

**提交信息**:
- c93f3bf: docs: 添加代码审计文档体系

**备注**:
- 初始化审计文档体系
- 包含 19 项待办事项
- 建立可追溯的改动记录机制

---

### 🔒 安全修复

**改动文件**:
- `src/services/secureStore.ts`: 创建安全存储服务（新增）
- `src/stores/appStore.ts`: 修改 API Key 存储逻辑
- `src/App.tsx`: 添加启动时加载 API Key
- `src-tauri/src/main.rs`: 注册 tauri-plugin-store
- `src-tauri/Cargo.toml`: 添加 tauri-plugin-store 依赖
- `package.json`: 添加 @tauri-apps/plugin-store 依赖

**关联待办**:
- [SEC-001] API Key 明文存储

**提交信息**:
- 待提交

**备注**:
- 使用 Tauri Store 插件替代 localStorage
- 实现自动从 localStorage 迁移
- 保留 localStorage 作为错误回退

---

### 🔧 配置

**改动文件**:
- `src-tauri/tauri.conf.json`: 配置 CSP 安全策略

**关联待办**:
- [SEC-002] CSP 策略禁用

**提交信息**:
- 待提交

**备注**:
- 配置严格的 CSP 策略
- 允许必要的外部资源（Google Fonts、xAI API）
- 禁止 iframe 和插件

---

### 🔒 安全修复

**改动文件**:
- `src-tauri/src/main.rs`: 添加文件路径验证和敏感文件过滤
- `src/App.tsx`: 传递 projectPath 参数给 read_file_content

**关联待办**:
- [SEC-003] 文件路径遍历风险

**提交信息**:
- 待提交

**备注**:
- 使用 canonicalize 规范化路径
- 验证文件在项目目录内
- 阻止访问 .ssh、.env 等敏感文件

---

### 🔒 安全修复

**改动文件**:
- `src-tauri/src/main.rs`: 添加 sanitize_prompt 输入清理函数

**关联待办**:
- [SEC-004] Shell 命令注入风险

**提交信息**:
- 待提交

**备注**:
- 限制输入最大长度为 100KB
- 移除 null 字节
- 记录危险模式用于审计
- 使用 Tauri arg() 自动处理转义

---

### 🐛 Bug 修复

**改动文件**:
- `src/components/ErrorBoundary.tsx`: 创建错误边界组件（新增）
- `src/main.tsx`: 包裹应用添加错误边界

**关联待办**:
- [MID-001] 缺少错误边界

**提交信息**:
- 待提交

**备注**:
- 创建 ErrorBoundary 类组件
- 实现友好的错误回退 UI
- 支持重试和重新加载功能
- 在应用根组件添加错误边界

---

### 🐛 Bug 修复

**改动文件**:
- `src/App.tsx`: 使用 useRef 稳定事件监听器

**关联待办**:
- [MID-002] 内存泄漏风险

**提交信息**:
- 待提交

**备注**:
- 使用 useRef 存储 handleGrokEvent 回调
- 创建稳定的事件处理函数
- 移除 useEffect 依赖中的 handleGrokEvent
- 确保监听器只注册一次

---

### ♻️ 重构

**改动文件**:
- `src-tauri/src/main.rs`: 统一使用 tokio::sync::Mutex

**关联待办**:
- [MID-003] 并发安全问题

**提交信息**:
- 待提交

**备注**:
- 将 current_child 从 std::sync::Mutex 改为 tokio::sync::Mutex
- 统一使用 tokio::sync::Mutex 避免阻塞
- 确保锁在 .await 期间保持持有

---

### ✨ 新功能

**改动文件**:
- `src/services/typeValidation.ts`: 创建类型验证服务（新增）
- `src/stores/appStore.ts`: 使用类型安全的解析

**关联待办**:
- [MID-004] 类型安全不足

**提交信息**:
- 待提交

**备注**:
- 安装 zod 库用于运行时类型验证
- 定义 GrokEvent、RawToolCall、RawToolResult、PermissionRequest 的 Zod schema
- 使用 safeParse 替代类型断言
- 提升类型安全性

---

### ♻️ 重构

**改动文件**:
- `src/stores/chatStore.ts`: 创建聊天状态 store（新增）
- `src/stores/sessionStore.ts`: 创建会话状态 store（新增）
- `src/stores/settingsStore.ts`: 创建设置状态 store（新增）
- `src/stores/appStore.ts`: 重构为组合 store

**关联待办**:
- [QUA-001] 单文件过大

**提交信息**:
- 待提交

**备注**:
- 拆分 appStore.ts 为三个独立 store
- 创建 useAppStore 组合 hook 保持向后兼容
- 每个 store 职责单一，易于维护
- 提升代码可维护性

---

### ✨ 新功能

**改动文件**:
- `src/constants/config.ts`: 创建配置常量文件（新增）
- `src/stores/sessionStore.ts`: 使用命名常量
- `src/components/ApprovalModal.tsx`: 使用命名常量
- `src/components/ToolCard.tsx`: 使用命名常量

**关联待办**:
- [QUA-002] 魔法数字和硬编码

**提交信息**:
- 待提交

**备注**:
- 创建集中管理的配置文件
- 定义所有常量和配置
- 修改代码使用命名常量
- 提升代码可读性

---

### ✅ 测试

**改动文件**:
- `vitest.config.ts`: 创建 Vitest 配置文件（新增）
- `src/test/setup.ts`: 创建测试设置文件（新增）
- `src/test/typeValidation.test.ts`: 创建类型验证测试（新增）
- `package.json`: 添加测试脚本和依赖

**关联待办**:
- [QUA-004] 缺少单元测试

**提交信息**:
- 待提交

**备注**:
- 安装 Vitest、@testing-library/react、@testing-library/jest-dom、jsdom
- 配置 Vitest 测试框架
- 创建 14 个测试用例
- 所有测试通过

---

## 📝 改动类型说明

### 安全修复 🔒
- 修复安全漏洞
- 加强安全防护
- 更新安全配置

### Bug 修复 🐛
- 修复功能缺陷
- 修复错误处理
- 修复边界情况

### 新功能 ✨
- 添加新功能
- 添加新组件
- 添加新 API

### 重构 ♻️
- 代码结构调整
- 性能优化
- 代码清理

### 文档 📝
- 更新文档
- 添加注释
- 完善说明

### 样式 🎨
- UI 调整
- CSS 优化
- 响应式改进

### 性能 ⚡
- 性能优化
- 内存优化
- 加载优化

### 测试 ✅
- 添加测试
- 修复测试
- 测试配置

### 配置 🔧
- 构建配置
- 开发配置
- 部署配置

### 依赖 📦
- 添加依赖
- 更新依赖
- 移除依赖

---

## 🔗 相关文档

- [审计报告](./AUDIT_REPORT.md)
- [待办事项](./TODO.md)
- [审计说明](./README.md)

---

## 📊 统计

| 类型 | 数量 |
|------|------|
| 🔒 安全修复 | 4 |
| 🐛 Bug 修复 | 3 |
| ✨ 新功能 | 3 |
| ♻️ 重构 | 2 |
| 📝 文档 | 1 |
| 🎨 样式 | 0 |
| ⚡ 性能 | 0 |
| ✅ 测试 | 1 |
| 🔧 配置 | 1 |
| 📦 依赖 | 2 |
| **总计** | **17** |
