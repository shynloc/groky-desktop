# Groky UI 对比分析与更新计划

**分析日期**: 2026-06-24  
**设计文件**: `Groky Desktop GUI Client/Groky.dc.html`  
**当前实现**: `src/components/*.tsx`  

---

## 📊 设计 vs 实现对比

### 1. 整体布局

| 设计 | 当前实现 | 状态 |
|------|----------|------|
| Icon Dock (48px) + Sidebar (220px) + Main + Right Pane (260px) | Sidebar (260px) + Main + Right Pane (300px) | ⚠️ 部分实现 |
| 顶部导航栏 52px | 顶部导航栏 52px | ✅ 一致 |
| GrokWork / GrokBuild 双模式切换 | 仅实现 GrokBuild 模式 | ❌ 缺失 |

### 2. Icon Dock (左侧图标栏)

**设计**: 48px 宽度，包含 GrokWork、GrokBuild 切换按钮和功能图标

**当前实现**: 无此组件

**差距**: 完全缺失，需要新增

### 3. 顶部导航栏

| 功能 | 设计 | 当前实现 | 状态 |
|------|------|----------|------|
| 品牌 Logo | ✅ | ✅ | ✅ 一致 |
| 模式切换标签 | ✅ | ❌ | ❌ 缺失 |
| Open Project 按钮 | ✅ | ✅ | ✅ 一致 |
| 项目路径显示 | ✅ | ✅ | ✅ 一致 |
| 模型选择器 | ✅ | ✅ | ✅ 一致 |
| YOLO 模式按钮 | ✅ | ✅ (Plan/Approve) | ⚠️ 部分实现 |
| Streaming 指示器 | ✅ | ✅ | ✅ 一致 |
| 设置按钮 | ✅ | ✅ | ✅ 一致 |

### 4. 侧边栏

| 功能 | 设计 | 当前实现 | 状态 |
|------|------|----------|------|
| 文件树 (Explorer) | ✅ | ✅ | ✅ 一致 |
| Sessions 列表 | ✅ | ✅ | ✅ 一致 |
| 多种视图切换 (Chat/Docs/Image/Voice/Projects/Research) | ✅ | ❌ | ❌ 缺失 |
| 最近项目列表 | ✅ | ✅ | ✅ 一致 |

### 5. 主聊天区域

| 功能 | 设计 | 当前实现 | 状态 |
|------|------|----------|------|
| 欢迎屏幕 | ✅ | ✅ | ✅ 一致 |
| 用户消息气泡 | ✅ | ✅ | ✅ 一致 |
| AI 消息 (Markdown) | ✅ | ✅ | ✅ 一致 |
| Thinking 折叠块 | ✅ | ✅ | ✅ 一致 |
| Tool Cards | ✅ | ✅ | ✅ 一致 |
| Streaming 指示器 | ✅ | ✅ | ✅ 一致 |
| Composer 输入框 | ✅ | ✅ | ✅ 一致 |
| Effort 选择器 | ✅ | ✅ | ✅ 一致 |

### 6. 右侧面板

| 功能 | 设计 | 当前实现 | 状态 |
|------|------|----------|------|
| Context 标签页 | ✅ | ✅ | ✅ 一致 |
| Diff 标签页 | ✅ | ✅ | ✅ 一致 |
| Skills 标签页 | ✅ | ✅ | ✅ 一致 |
| Commands 标签页 | ✅ | ✅ | ✅ 一致 |
| Settings 标签页 | ✅ | ✅ | ✅ 一致 |
| Suggested 提示 | ✅ | ❌ | ❌ 缺失 |

### 7. 模态弹窗

| 功能 | 设计 | 当前实现 | 状态 |
|------|------|----------|------|
| Permission Modal | ✅ | ✅ | ✅ 一致 |
| Project Picker | ✅ | ❌ | ❌ 缺失 |
| Command Palette (⌘K) | ✅ | ❌ | ❌ 缺失 |

### 8. 设计风格

| 元素 | 设计 | 当前实现 | 状态 |
|------|------|----------|------|
| 字体 | Space Grotesk + DM Sans + JetBrains Mono | ✅ | ✅ 一致 |
| 颜色方案 (Dark) | #0a0a0a 背景 + 橙色强调 | ✅ | ✅ 一致 |
| 圆角 | 6-8px | ✅ | ✅ 一致 |
| 动画 | slide-up, fade-in, pulse | ✅ | ✅ 一致 |

---

## 🎯 UI 更新计划

### Phase 1: 核心功能补全 (1-2 周)

#### 1.1 Icon Dock 组件
**优先级**: 高
**工作量**: 2-3 天

**实现内容**:
- 创建 `IconDock.tsx` 组件
- 实现 GrokWork / GrokBuild 模式切换
- 添加功能图标 (Settings, Extensions 等)
- 集成到主布局

#### 1.2 模式切换功能
**优先级**: 高
**工作量**: 3-4 天

**实现内容**:
- 实现 GrokWork 模式 (Chat, Docs, Image, Voice, Projects, Research)
- 实现 GrokBuild 模式 (当前已实现)
- 添加模式切换逻辑和状态管理
- 更新侧边栏根据模式显示不同内容

#### 1.3 Command Palette (⌘K)
**优先级**: 中
**工作量**: 2-3 天

**实现内容**:
- 创建 `CommandPalette.tsx` 组件
- 实现快捷键触发 (⌘K)
- 实现命令搜索和执行
- 集成 slash commands

### Phase 2: 增强功能 (2-3 周)

#### 2.1 Project Picker
**优先级**: 中
**工作量**: 2 天

**实现内容**:
- 创建 `ProjectPicker.tsx` 组件
- 实现项目搜索和选择
- 显示最近项目列表
- 集成到 Open Project 流程

#### 2.2 Suggested Prompts
**优先级**: 低
**工作量**: 1 天

**实现内容**:
- 在右侧面板添加 Suggested 区域
- 根据上下文生成建议
- 实现点击填充到 Composer

#### 2.3 完善 Welcome Screen
**优先级**: 低
**工作量**: 1 天

**实现内容**:
- 添加 GrokWork / GrokBuild / 1M Context 三个功能卡片
- 实现卡片点击跳转
- 添加 Command Palette 快捷键提示

### Phase 3: 优化体验 (持续)

#### 3.1 响应式优化
- 优化小屏幕布局
- 添加折叠/展开动画
- 优化触摸交互

#### 3.2 快捷键支持
- 实现 ⌘K Command Palette
- 添加常用快捷键
- 显示快捷键提示

#### 3.3 动画优化
- 优化页面切换动画
- 添加加载状态动画
- 优化滚动行为

---

## 📋 实现优先级

| 优先级 | 功能 | 工作量 | 依赖 |
|--------|------|--------|------|
| P0 | Icon Dock | 2-3 天 | 无 |
| P0 | 模式切换 | 3-4 天 | Icon Dock |
| P1 | Command Palette | 2-3 天 | 无 |
| P1 | Project Picker | 2 天 | 无 |
| P2 | Suggested Prompts | 1 天 | 无 |
| P2 | Welcome Screen 完善 | 1 天 | 无 |

**预计总工作量**: 11-14 天

---

## 🔧 技术实现建议

### 1. 状态管理
```typescript
// 新增模式状态
interface AppState {
  mode: 'work' | 'build';
  workView: 'chat' | 'docs' | 'image' | 'voice' | 'projects' | 'research';
  // ...existing state
}
```

### 2. 组件结构
```
src/components/
├── IconDock.tsx          # 新增
├── CommandPalette.tsx    # 新增
├── ProjectPicker.tsx     # 新增
├── TopBar.tsx            # 更新
├── Sidebar.tsx           # 更新
└── ...existing components
```

### 3. 路由集成
```typescript
// 使用 Tauri 的路由或状态管理
const mode = useAppStore((s) => s.mode);
const workView = useAppStore((s) => s.workView);
```

---

## 📝 注意事项

1. **渐进式实现**: 优先实现核心功能，避免一次性大改
2. **向后兼容**: 保持现有功能正常工作
3. **测试覆盖**: 新增功能需要添加测试
4. **文档更新**: 实现后更新相关文档
5. **设计还原**: 尽量还原设计稿的视觉效果

---

## 🔗 相关资源

- **设计文件**: `Groky Desktop GUI Client/Groky.dc.html`
- **设计截图**: `Groky Desktop GUI Client/screenshots/`
- **当前代码**: `src/components/`
- **状态管理**: `src/stores/`
