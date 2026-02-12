# 变更日志: 插件数据源扩展与BFF分发完善

## 基本信息
- **时间**: 2026年02月12日 12:11
- **目标**: 完成插件数据源类型扩展的服务层支持、补齐BFF分发逻辑，并生成数据库迁移。
- **提交人**: BackendAgent(python)

## 变更范围
- [service.py](file:///g:/work/project/bishe/Agent/Novel_Assistant/backend/src/services/plugin/service.py):
  - `get_plugin_detail` 与 `update_plugin` 统一使用新配置模型与数据源字段序列化/反序列化。
  - `proxy_plugin_data` 支持 URL/INTERNAL/JSON/CHECKPOINT 数据源分发与空载荷返回。
- [test_plugin.py](file:///g:/work/project/bishe/Agent/Novel_Assistant/backend/tests/api/test_plugin.py):
  - 更新插件配置请求结构以匹配 `PluginConfig`。
- [alembic migration](file:///g:/work/project/bishe/Agent/Novel_Assistant/backend/alembic/versions/b12f3a9c2d10_add_plugin_data_source_type_config.py):
  - 新增 `data_source_type` 与 `data_source_config` 字段迁移，并回填 URL 类型数据。

## 验证方式与结果
- `python -m ruff check src tests`: 未通过，存在既有未整理导入与未使用导入等问题（多文件）。
- `python -m mypy`: 未通过，`src/core/agents/document_helper_agent/graph.py` 存在语法错误导致中断。
- `python -m pytest`: 未通过，测试库未迁移导致 `plugin.data_source_type` 字段缺失。
