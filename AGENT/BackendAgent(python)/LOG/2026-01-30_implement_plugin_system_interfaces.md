# 变更记录

**时间**: 2026-01-30
**目标**: 实现插件系统的分层接口（系统配置 vs 扩展功能），对齐前后端插件类型定义，并初始化核心插件数据。
**变更范围**:
1.  **Backend**:
    -   `src/services/plugin/service.py`: 新增 `get_system_plugins` 和 `get_expand_plugins` 方法；在 `update_plugin` 中增加 SYSTEM 插件不可禁用的校验逻辑；修正 `PluginMetaResponse` 实例化时的字段冗余。
    -   `src/api/routes/plugin/router.py`: 新增 `GET /plugin/system` 和 `GET /plugin/expand` 路由。
    -   `scripts/init_plugins.py`: 更新插件初始化脚本，将 "记忆"、"知识库"、"项目助手"、"文档创作助手" 定义为 OFFICIAL 类型，"作品类型管理"、"Agent管理插件" 定义为 SYSTEM 类型；使用中文名称初始化。

2.  **Frontend**:
    -   `src/services/pluginService.ts`: 新增 `getSystemPlugins` 方法调用 `/plugin/system`；更新 `getPlugins` 调用 `/plugin/expand`；新增 `mapResponseToInstance` 适配器。
    -   `src/components/dashboard/Dashboard.tsx`: 更新 `SYSTEM_PLUGIN_MAP` 以支持中文插件名称 ("记忆", "知识库" 等) 的图标和类型映射。

**验证方式与结果**:
-   **数据库验证**: 运行 `init_plugins.py` 成功，数据库中插件数据已更新为最新分类和中文名称。
-   **接口验证**: 后端代码静态检查通过，路由定义符合 OpenAPI 规范。
-   **逻辑验证**:
    -   `/plugin/system` 仅返回 SYSTEM 类型插件。
    -   `/plugin/expand` 仅返回 OFFICIAL/CUSTOM 类型插件。
    -   前端 Dashboard "扩展功能" 区域将通过 `/plugin/expand` 获取并展示记忆、知识库及助手插件。
    -   尝试禁用 SYSTEM 插件将抛出 `ValueError`。
