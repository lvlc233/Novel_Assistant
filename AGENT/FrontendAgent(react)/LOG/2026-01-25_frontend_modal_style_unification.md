# Frontend Refactor Log - Unify Modal Styles

## 1. Metadata
- **Date**: 2026-01-25
- **Author**: FrontendAgent(react)
- **Goal**: 统一 `NovelPluginConfigModal` 组件的样式，使其符合项目的 Design System。

## 2. Issue Description
用户反馈“绿色圆圈”弹出的 `NovelPluginConfigModal` 组件风格与项目中其他 Modal（如 `EditNovelModal`）不统一。主要表现为使用了硬编码的 Tailwind 颜色（如 `bg-gray-50`, `text-gray-900`）而非项目定义的语义化变量（如 `bg-surface-secondary`, `text-text-primary`）。

## 3. Changes
对 `src/components/novel-manager/NovelPluginConfigModal.tsx` 进行了重构，替换了所有硬编码的颜色和样式类：

- **容器背景**: `bg-white` -> `bg-surface-white`
- **次级背景**: `bg-gray-50` -> `bg-surface-secondary`
- **边框颜色**: `border-gray-100` -> `border-border-primary`
- **文本颜色**: 
    - `text-gray-900` -> `text-text-primary`
    - `text-gray-500` -> `text-text-secondary`
- **按钮样式**: 
    - 主按钮: `bg-black` -> `bg-text-primary`
    - 次按钮: `text-gray-600` -> `text-text-secondary`
- **图标容器**: `bg-green-100` -> `bg-surface-secondary` (统一风格，不再特殊使用绿色)
- **高亮状态**: 保持了部分功能性的颜色（如启用的绿色），但在未启用状态下使用了更中性的 Design System 颜色。

## 4. Verification
- **Method**: 代码对比。
- **Result**: 组件现在使用与其他 Modal 相同的 CSS 变量和类名结构，视觉风格应保持一致。
