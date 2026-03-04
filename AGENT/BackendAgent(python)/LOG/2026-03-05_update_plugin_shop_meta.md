# 更新 PluginShopMetaResponse Schema

**时间**: 2026-03-05 06:12
**目标**: 在插件商店列表响应中包含插件的配置 Schema，以便前端可以直接展示和使用配置表单。
**变更范围**:
1.  `backend/src/api/routes/plugin/schema.py`: 在 `PluginShopMetaResponse` 中添加 `config_schema` 字段。
2.  `backend/src/api/routes/plugin/router.py`: 更新 `get_shop_plugins` 函数，从 `plugin_entity.runtime_config` (如果已安装) 或 `plugin_definition` (如果未安装) 中填充 `config_schema`。

**验证方式与结果**:
- 代码静态检查通过。
- 逻辑上，`PluginSQLEntity.runtime_config` 存储了配置 Schema，因此优先使用它。如果插件未安装，则回退到注册表中的定义。
