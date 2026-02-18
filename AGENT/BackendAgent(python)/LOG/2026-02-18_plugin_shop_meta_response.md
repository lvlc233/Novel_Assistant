## 时间
2026-02-18 18:39

## 目标
调整插件商店接口返回插件元数据字段，供前端卡片展示。

## 变更范围
- backend/src/api/routes/plugin/router.py

## 验证方式与结果
- uv run python -m ruff check src tests（未通过：仓库既有导入排序、未使用导入、测试断言与打印等问题）
- uv run python -m mypy（未通过：仓库既有类型注解问题）
