# 变更日志
## [2026-01-16 14:44] UI Refactoring and Editor Integration
**目标**: 重构 UI 组件库，移除 legacy base 组件，集成 Tiptap 编辑器。
**变更范围**:
1.  **UI 组件库 (`src/components/ui`)**:
    -   新增 `Button.tsx`: 基于 Shadcn UI 设计，使用 `cva` 管理变体，支持 `variant` (default, destructive, outline, secondary, ghost, link) 和 `size`。
    -   新增 `Input.tsx`: 统一输入框样式，支持 `leftIcon`, `rightIcon`, `error` 状态。
2.  **公共组件 (`src/components/common`)**:
    -   迁移 `SearchBar.tsx` 和 `BottomInput.tsx` 从 `src/components/base` 到 `src/components/common`。
    -   重构上述组件以使用新的 UI 组件库。
3.  **编辑器集成**:
    -   新增 `src/components/DocumentEdit/TiptapEditor.tsx`: 封装 Tiptap 编辑器，配置 StarterKit 和 Placeholder。
    -   更新 `src/components/DocumentEdit/DocumentEditor.tsx`: 替换原生 `textarea` 为 `TiptapEditor`，修复字数统计逻辑（去除 HTML 标签）。
4.  **清理**:
    -   删除 `src/components/base` 目录及其内容。
**验证方式**:
    -   运行 `npx tsc --noEmit` 确保无类型错误。
    -   代码审查确保 import 路径已更新。
