## 时间
2026-02-18 18:50

## 目标
调整插件路由顺序，避免 /plugin/shop 被 UUID 路由误匹配。

## 变更范围
- backend/src/api/routes/plugin/router.py

## 验证方式与结果
- uv run python -m ruff check src tests（未通过：仓库既有导入排序、未使用导入、测试断言与打印等问题）
- uv run python -m mypy（未通过：仓库既有类型注解问题）
