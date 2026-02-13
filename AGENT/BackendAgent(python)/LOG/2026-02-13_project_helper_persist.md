## 时间
2026-02-13 01:50

## 目标
为项目助手配置与资源提供后端持久化能力，并清理路由内存逻辑。

## 变更范围
- backend/src/services/agent/project_helper_service.py
- backend/src/api/routes/agent/project_helper/router.py

## 验证方式与结果
- python -m ruff check src tests（未通过：存在既有未使用导入、导入排序、测试代码比较 False、print 等问题）
- python -m mypy（未通过：src/core/agents/document_helper_agent/graph.py 语法错误导致中断）
- python -m pytest（通过：32 passed）
