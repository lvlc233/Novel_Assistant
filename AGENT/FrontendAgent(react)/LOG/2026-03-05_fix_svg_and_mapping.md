# 修复 SVG 属性和插件数据映射

**时间**: 2026-03-05
**目标**: 修复控制台 SVG 属性报错，并确保插件配置 Schema 正确映射，以便插件设置模态框能正确渲染。

**变更范围**:
1.  **frontend/novel-assistant-frontend/src/components/sdui/DocumentSessionManager.tsx**:
    -   将 `stroke-width`, `stroke-linecap`, `stroke-linejoin` 替换为 React 兼容的 `strokeWidth`, `strokeLinecap`, `strokeLinejoin`。
2.  **frontend/novel-assistant-frontend/src/components/sdui/ProjectSessionManager.tsx**:
    -   将 `stroke-width`, `stroke-linecap`, `stroke-linejoin` 替换为 React 兼容的 `strokeWidth`, `strokeLinecap`, `strokeLinejoin`。
3.  **frontend/novel-assistant-frontend/src/services/pluginService.ts**:
    -   更新 `PluginShopItem` 接口，增加 `config_schema?: Record<string, any>;` 字段。
4.  **frontend/novel-assistant-frontend/src/components/dashboard/Dashboard.tsx**:
    -   在 `mapShopItemToPlugin` 函数中，将 `item.config_schema` 映射到 `PluginInstance.configSchema`。

**验证方式与结果**:
-   **SVG 修复**: 代码审查确认所有相关 SVG 属性已更正为驼峰命名，消除了 React 控制台警告。
-   **数据映射**: 代码审查确认 `config_schema` 字段已添加到接口定义，并在转换函数中正确赋值。这确保了从商店获取的插件在前端实例化时包含配置 Schema，从而使设置模态框能够根据 Schema 渲染配置项。
