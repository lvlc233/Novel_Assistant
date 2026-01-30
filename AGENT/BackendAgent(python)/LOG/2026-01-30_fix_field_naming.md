# 字段命名规范化日志

## 时间
2026-01-30 09:55

## 目标
统一 Work/Document/Memory 等模块的响应与请求字段命名，消除冗余前缀（如 `work_name` -> `name`），并对齐规范文档。

## 变更范围

### Work 模块
- **文件**: `backend/src/api/routes/work/schema.py`
  - `WorkMetaDTO`: 移除 `work_` 前缀（`work_id` -> `id`, `work_name` -> `name` 等）。
  - `NodeDTO`: 添加 `parent_node_id` 字段。
- **文件**: `backend/src/services/work/service.py`
  - 更新 `create_work`, `get_work_list`, `get_work_detail`, `update_work_meta`, `_to_meta_dto` 方法以适配新 Schema。
  - 修复 `NodeDTO` 构造时缺失 `parent_node_id` 的问题。

### Node/Document 模块
- **文件**: `backend/src/api/routes/node/schema.py`
  - 统一字段名：`node_id` -> `id`, `node_name` -> `name`, `node_type` -> `type`, `fater_node_id` -> `parent_node_id`。
  - `Document` 相关模型同步更新（`document_id` -> `id`, `title` 保持不变，`fater_node_id` -> `parent_node_id`）。
- **文件**: `backend/src/services/node/service.py`
  - 更新 `create_node`, `get_node_detail`, `update_node` 以适配新 Schema。
- **文件**: `backend/src/api/routes/node/router.py`
  - 更新路由处理函数中的 DTO 构造。
  - **路由路径修正**: 将复数路径改为单数（如 `/nodes/{node_id}` -> `/node/{node_id}`），与规范保持一致。

### Memory 模块
- **文件**: `backend/src/api/routes/memory/schema.py`
  - `MemoryMetaResponse`: `memory_id` -> `id`, `memory_name` -> `name`, `memory_description` -> `description`。
  - `MemoryDetailResponse`: `memory_content` -> `context` (与请求模型统一)。
  - `MemoryCreateRequest/UpdateRequest`: `memory_context` -> `context`。
- **文件**: `backend/src/services/memory/service.py`
  - 更新所有相关方法以适配新 Schema。

## 验证方式
- 代码审查：确认所有字段引用均已更新。
- 静态检查：运行 `ruff check` 确保无严重语法错误（剩余 docstring 等警告待后续处理）。
- 逻辑一致性：确认 Service 层与 API 层的数据传递无字段丢失。

## 结果
已完成所有相关模块的字段标准化。
