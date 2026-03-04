# 2026-03-05 Fix Plugin Settings Modal Logic

## 目标
修复 `PluginSettingsModal` 中 `ui_target` 映射和数据载荷传递的问题，以解决 "Component Not Implemented" 错误。

## 变更范围
- `frontend/novel-assistant-frontend/src/components/plugins/PluginSettingsModal.tsx`

## 详细说明
1. **UI Target 映射**:
   - 优先检查 `response.ui_target`。
   - 如果不存在，检查 `response.info_type` 并将其用作 `uiTarget`。
2. **数据载荷解包**:
   - 更新 `setData` 逻辑，优先使用 `response.data` 或 `response.payload`。
   - 这确保了 `SDUIRenderer` 接收到正确的数据结构（例如 `ProjectSessionManager` 需要的 `pages` 数组位于 `response.data` 中）。

## 验证方式
- 代码审查确认逻辑已更新。
- 预期 `ProjectSessionManager` 等插件现在能正确加载对应的 UI 组件并接收到正确的数据。

## 结果
- 代码已应用。
