# 变更日志: 移除插件data_source_url字段

## 基本信息
- **时间**: 2026年02月12日 20:50
- **目标**: 统一插件数据源表达，移除 data_source_url，使用 data_source_type + data_source_config。
- **提交人**: BackendAgent(python)

## 变更范围
- [schema.py](file:///g:/work/project/bishe/Agent/Novel_Assistant/backend/src/api/routes/plugin/schema.py):
  - 移除 PluginResponse 与 PluginUpdateRequest 中的 data_source_url 字段。
- [pg_models.py](file:///g:/work/project/bishe/Agent/Novel_Assistant/backend/src/infrastructure/pg/pg_models.py):
  - 移除 PluginSQLEntity 的 data_source_url 列定义。
- [service.py](file:///g:/work/project/bishe/Agent/Novel_Assistant/backend/src/services/plugin/service.py):
  - 仅使用 data_source_config 解析数据源，移除 data_source_url 相关逻辑。
- [alembic migration](file:///g:/work/project/bishe/Agent/Novel_Assistant/backend/alembic/versions/e7c3f0f2f4a1_drop_plugin_data_source_url.py):
  - 增加迁移删除 plugin.data_source_url。

## 验证方式与结果
- `alembic upgrade head`: 通过（执行 e7c3f0f2f4a1）。
- `python -m ruff check src tests`: 未通过，存在既有导入排序/未使用导入等问题（多文件）。
- `python -m mypy`: 未通过，`src/core/agents/document_helper_agent/graph.py` 存在语法错误导致中断。
- `python -m pytest tests/api/test_plugin.py`: 通过。
