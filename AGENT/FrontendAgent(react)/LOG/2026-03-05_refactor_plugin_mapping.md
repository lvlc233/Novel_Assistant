# 2026-03-05 05:45 Refactor Plugin Mapping

## 目标
重构插件映射逻辑，使其在 Dashboard 和 PluginsPage 之间复用。

## 变更范围
1.  `src/services/pluginService.ts`: 添加并导出 `mapShopItemToPlugin` 函数。
2.  `src/components/dashboard/Dashboard.tsx`: 移除本地 `mapShopItemToPlugin`，改用服务中的导出函数。
3.  `src/app/plugins/page.tsx`: 更新 `loadPlugins` 使用 `mapShopItemToPlugin`，并将状态类型更新为 `PluginInstance[]`。修复了卸载逻辑。

## 验证方式
- 检查代码编译是否通过（无明显语法错误）。
- 逻辑上确认 `mapShopItemToPlugin` 的迁移和复用正确。
- 确认 `PluginsPage` 现在使用 `PluginInstance` 类型。

## 结果
- [x] 代码修改完成。
