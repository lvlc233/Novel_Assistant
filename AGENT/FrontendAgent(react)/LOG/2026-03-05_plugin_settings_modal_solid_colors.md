# 2026-03-05 Plugin Settings Modal Solid Colors Fix

## 目标
解决 Plugin Settings Modal 中的透明度问题，确保所有背景都是不透明的实色。

## 变更范围
- `frontend/novel-assistant-frontend/src/components/plugins/PluginSettingsModal.tsx`

## 详情
1.  **Modal Container**: `bg-surface-primary` -> `bg-white`
2.  **Header Icon Background**: `bg-surface-secondary` -> `bg-gray-100`
3.  **Main Content Area**: `bg-surface-secondary` -> `bg-gray-50`
4.  **Cards**: `bg-surface-white` -> `bg-white`

## 验证方式
- 检查代码，确认所有 `surface-*` 类已被替换为具体的 `bg-white`, `bg-gray-50`, `bg-gray-100`。
- 确认 Modal 及其子组件不再依赖半透明或变量背景。

## 结果
- 已完成替换。
