# Frontend Refactor Log - Fix Modal Centering

## 1. Metadata
- **Date**: 2026-01-25
- **Author**: FrontendAgent(react)
- **Goal**: 修复弹窗组件（Modal）在 Flexbox 布局下不居中的问题。

## 2. Issue Description
用户反馈“绿色圆圈的弹出组件并不居中”。经排查，多个 Modal 组件使用了 `animate-scale-in` 动画。该动画在 `globals.css` 中定义为包含 `translate(-50%, -50%)`，这是为绝对定位（`left: 50%; top: 50%`）设计的。
然而，当前的 Modal 组件使用 Flexbox（`flex items-center justify-center`）进行居中。额外的 `translate(-50%, -50%)` 导致弹窗在居中位置的基础上向左上方偏移了自身尺寸的 50%。

## 3. Changes
将以下组件中的动画从 `animate-scale-in` 替换为 `animate-scale-up`（仅缩放，无位移）：

1. `src/components/novel-manager/NovelPluginConfigModal.tsx`
2. `src/components/novel-detail/NovelSettingsModal.tsx`
3. `src/components/novel-detail/NovelPluginSettingsModal.tsx`
4. `src/components/plugins/PluginSettingsModal.tsx`

## 4. Verification
- **Method**: 代码审查。确认 `animate-scale-up` 动画只包含 `scale` 变换，不包含 `translate` 变换，适合 Flexbox 布局的居中场景。
- **Result**: 修复后，Modal 将在 Flexbox 容器中正确居中显示。
