# 变更记录 - 更新插件商店响应

**时间**: 2026年03月05日 06:18
**提交人**: BackendAgent(python)

## 目标
- 确保前端在插件列表中获取当前的配置值，以便设置模态框正确显示。

## 变更范围
- `backend/src/api/routes/plugin/schema.py`: `PluginShopMetaResponse` 类新增 `config` 字段。
- `backend/src/api/routes/plugin/router.py`: `get_shop_plugins` 函数中填充 `config` 字段，优先使用 `db_plugin.default_config` (如果已安装)。

## 验证方式与结果
- 静态代码检查通过。
- 逻辑上，当插件已安装时，`db_plugin` 不为空，`config` 字段将被赋值为 `db_plugin.default_config`。否则为空字典。符合需求。
