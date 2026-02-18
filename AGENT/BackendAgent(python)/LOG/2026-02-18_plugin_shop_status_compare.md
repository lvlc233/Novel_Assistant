## 时间
2026-02-18 20:20

## 目标
插件商店列表对比内部注册表与数据库，返回安装状态与版本差异信息。

## 变更范围
- backend/src/api/routes/plugin/schema.py
- backend/src/api/routes/plugin/router.py
- backend/src/services/plugin/service.py

## 验证方式与结果
- uv run python -m ruff check src tests（未通过：仓库既有导入排序、未使用导入、测试断言与打印等问题）
- uv run python -m mypy（未通过：仓库既有类型注解问题）
