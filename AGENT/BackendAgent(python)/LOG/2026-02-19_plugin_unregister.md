## 变更记录
- 时间: 2026-02-19 01:26
- 目标: 补充插件从系统移除时的数据库删除能力
- 变更范围: core/plugin/runtime.py, api/routes/plugin/router.py
- 验证方式: uv run python -m ruff check src tests; uv run python -m mypy
- 验证结果: 失败（存在项目既有问题，未引入新增问题）
