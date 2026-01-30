# 变更日志: 字段命名规范化与响应码统一

## 基础信息
- **时间**: 2026-01-30 10:01
- **目标**: 完成 "Work/Document/Memory 等响应与请求字段命名偏离规范" (Task 2) 和 "统一响应 code 类型为 int 的规范未落地" (Task 3)。

## 变更范围

### 1. 字段命名规范化 (Task 2)
针对 `Agent` 和 `KnowledgeBase` 模块进行了补充规范化，确保所有模块遵循 `PROJECT/SPECIFICATION.md`。

- **Agent 模块**:
  - 文件: `backend/src/api/routes/agent/schema.py`, `backend/src/services/agent/service.py`
  - 变更: 将 `agent_type` 字段统一改为 `type`，移除冗余前缀。
  - 原因: 保持与 Work (type), Node (type) 等其他模块的一致性。

- **KnowledgeBase 模块**:
  - 文件: `backend/src/api/routes/knowledge_base/schema.py`, `backend/src/services/knowledge_base/service.py`
  - 变更: 将 `KnowledgeBaseChunkResponse` 中的 `kb_id` 改为 `knowledge_base_id`。
  - 原因: 避免非标准缩写，保持语义清晰。

### 2. 响应码类型统一 (Task 3)
- **全局**:
  - 验证了 `backend/src/api/base.py` 中 `Response` 模型的 `code` 字段已改为 `int`。
  - 验证了 `backend/src/common/errors.py` 中 `BaseError` 及其子类均使用 `int` 类型的错误码。
  - 验证了 `backend/src/api/error_handler.py` 正确处理 `int` 类型错误码并映射 HTTP 状态码。

## 验证结果
- **静态检查**:
  - `Grep` 搜索确认代码库中不再存在 `Response.fail(code="...")` 或 `BaseError("...")` 形式的字符串错误码使用。
  - 检查了修改后的 Schema 和 Service 代码，确保字段映射正确。

## 后续计划
- 开始处理 Task 4: "对外接口存在 Dict/Any 作为公开参数/返回，需改为显式模型契约"。重点关注 `Agent` 和 `Plugin` 的 `config` 字段。
