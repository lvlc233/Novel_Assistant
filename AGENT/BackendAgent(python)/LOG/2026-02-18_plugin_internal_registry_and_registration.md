## 时间
2026-02-18 17:46

## 目标
接入内部插件发现列表与外部注册入口，完成注册闭环。

## 变更范围
- backend/src/api/app.py
- backend/src/api/dependencies.py
- backend/src/api/routes/plugin/router.py
- backend/src/api/routes/plugin/schema.py
- backend/src/core/plugin/runtime.py

## 验证方式与结果
- uv run python -m ruff check src tests（通过）
- uv run python -m mypy（通过）
