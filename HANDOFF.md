# Groky Desktop - Handoff 文档

**项目**: Groky Desktop  
**GitHub**: https://github.com/shynloc/groky-desktop  
**创建日期**: 2026-06-24  
**当前版本**: v0.1.0  
**技术栈**: Tauri 2 + React 19 + TypeScript + Vite + Zustand  

---

## 📋 项目概述

Groky 是 Grok Build（xAI Grok CLI）的桌面 GUI 客户端。让强大的 Grok agentic coding 能力拥有现代化的可视化体验。

### 核心功能
- 流式聊天界面
- 文件树浏览
- Diff 查看和应用
- 权限管理
- 多会话支持
- 中英文国际化

---

## 🏗️ 项目结构

```
groky/
├── src/                          # React 前端
│   ├── components/               # UI 组件
│   │   ├── App.tsx              # 主应用组件
│   │   ├── ChatPane.tsx         # 聊天面板
│   │   ├── Composer.tsx         # 输入组件
│   │   ├── TopBar.tsx           # 顶部导航栏
│   │   ├── FileTree.tsx         # 文件树
│   │   ├── MessageItem.tsx      # 消息项
│   │   ├── ToolCard.tsx         # 工具卡片
│   │   ├── DiffView.tsx         # Diff 视图
│   │   ├── ApprovalModal.tsx    # 权限确认弹窗
│   │   └── ErrorBoundary.tsx    # 错误边界
│   ├── stores/                  # Zustand 状态管理
│   │   ├── chatStore.ts        # 聊天状态
│   │   ├── sessionStore.ts     # 会话状态
│   │   ├── settingsStore.ts    # 设置状态
│   │   └── appStore.ts         # 组合 store
│   ├── services/                # 服务层
│   │   ├── secureStore.ts      # 安全存储
│   │   ├── typeValidation.ts   # 类型验证
│   │   └── logger.ts           # 日志服务
│   ├── constants/               # 常量定义
│   │   ├── config.ts           # 配置常量
│   │   └── index.ts            # 基础常量
│   ├── components/              # 组件
│   ├── App.tsx                  # 主应用
│   ├── main.tsx                 # 入口文件
│   ├── types.ts                 # 类型定义
│   ├── i18n.ts                  # 国际化
│   └── styles.css               # 样式文件
├── src-tauri/                   # Rust 后端
│   ├── src/
│   │   └── main.rs             # 主进程
│   ├── Cargo.toml              # Rust 依赖
│   └── tauri.conf.json         # Tauri 配置
├── docs/                        # 文档
│   ├── audit/                   # 审计文档
│   │   ├── AUDIT_FINAL.md      # 审计最终报告
│   │   ├── TODO.md             # 待办事项
│   │   ├── CHANGELOG.md        # 改动记录
│   │   └── ...                 # 其他文档
│   ├── ARCHITECTURE.md         # 架构文档
│   ├── PRD.md                  # 产品需求
│   └── COMPONENTS.md           # 组件文档
├── package.json                 # 前端依赖
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
└── vitest.config.ts            # 测试配置
```

---

## 🔧 开发环境配置

### 前置条件
- Node.js 18+
- Rust (通过 rustup 安装)
- Tauri CLI: `npm install -g @tauri-apps/cli`

### 安装依赖
```bash
# 安装前端依赖
npm install

# 安装 Rust 依赖（自动）
cd src-tauri && cargo build
```

### 开发命令
```bash
# 前端开发（浏览器）
npm run dev

# Tauri 桌面开发
npm run tauri:dev

# 构建生产版本
npm run tauri:build

# 运行测试
npm test

# 类型检查
npm run build
```

---

## 📊 代码审计状态

### 已完成的改进 (13/19)

**P0 安全问题 (4/4)** ✅
- SEC-001: API Key 安全存储
- SEC-002: CSP 安全策略
- SEC-003: 文件路径验证
- SEC-004: 输入清理

**P1 重要问题 (4/4)** ✅
- MID-001: Error Boundary
- MID-002: 内存泄漏修复
- MID-003: 并发安全
- MID-004: 类型安全

**P2 改进项 (5/7)** ✅
- QUA-001: 拆分大文件
- QUA-002: 消除魔法数字
- QUA-004: 测试框架
- PERF-001: 滚动优化
- PERF-002: 文件树虚拟化
- PERF-003: 正则优化

### 代码质量评分
- **综合评分**: 7.5/10
- **安全性**: 8/10
- **代码质量**: 8/10

---

## 🎯 待处理事项

### P2 改进项 (2/7)
- QUA-003: CSS 命名不一致
- PERF-002: 文件树无虚拟化

### P3 优化项 (5/5)
- ARCH-001: 缺少日志系统
- ARCH-002: 缺少离线支持
- ARCH-003: 缺少自动更新
- ARCH-004: 国际化不完整
- DEP-001: 移除未使用的依赖

---

## 📝 开发规范

### Git 提交规范
```
<type>(<scope>): <subject>

type: feat|fix|docs|style|refactor|test|chore
scope: 可选，影响范围
subject: 简短描述
```

### 代码风格
- TypeScript strict 模式
- ESLint + Prettier
- 组件使用函数式组件 + Hooks
- 状态管理使用 Zustand

### 测试要求
- 核心函数必须有单元测试
- 测试框架: Vitest
- 运行测试: `npm test`

---

## 🔗 相关资源

- **GitHub**: https://github.com/shynloc/groky-desktop
- **设计文件**: `Groky Desktop GUI Client/` 目录
- **审计文档**: `docs/audit/` 目录
- **架构文档**: `docs/ARCHITECTURE.md`
- **产品需求**: `docs/PRD.md`

---

## 📞 联系方式

- **项目负责人**: taojin
- **GitHub**: https://github.com/shynloc
