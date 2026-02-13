## 时间
2026-02-13 01:59

## 目标
补齐数据库 rendertype 枚举值以匹配当前 RenderType。

## 变更范围
- backend/alembic/versions/f3a7b2c7c1c1_update_render_type_enum.py

## 验证方式与结果
- python -m ruff check src tests（未通过：存在既有导入排序、未使用导入、测试代码比较 False、print 等问题）
- python -m mypy（未通过：src/core/agents/document_helper_agent/graph.py 语法错误导致中断）
- python -m pytest（通过：32 passed）
