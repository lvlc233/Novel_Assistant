# 变更日志: Node 模块路由与字段修正

## 基础信息
- **时间**: 2026-01-30 10:06
- **目标**: 彻底完成 "接口路由前缀与路径未对齐规范" (Task 1) 和 "Work/Document/Memory 等响应与请求字段命名偏离规范" (Task 2)。

## 变更范围

### 1. Node 模块 (node/router.py, node/service.py)
- **路由修正**:
  - `DELETE /work/{work_id}/nodes/{node_id}` -> `/work/{work_id}/node/{node_id}` (Line 120)
  - `PATCH /work/{work_id}/nodes/{node_id}` -> `/work/{work_id}/node/{node_id}` (Line 130)
  - `GET /work/{work_id}/documents` -> `/work/{work_id}/document` (Line 148)
- **字段命名修正**:
  - 修正了 `node/router.py` 中 `CreateNodeDTO` 和 `UpdateNodeDTO` 的实例化参数，从 `node_name`, `node_type`, `fater_node_id` 改为 `name`, `type`, `parent_node_id`，以匹配 Schema 定义。
  - 修正了 `node/service.py` 中 `create_node` 方法对 `CreateNodeDTO` 字段的访问方式 (从 `.node_name` 改为 `.name` 等)。
  - 修正了 `node/service.py` 返回的 `NodeDetailResponse` 字段构造，确保返回 `id`, `name`, `parent_node_id` 而非 `node_id`, `node_name`, `fater_node_id`。

## 验证结果
- **静态检查**:
  - 确认 `node/router.py` 中的路由路径已全部单数化。
  - 确认 `node/service.py` 与 `node/schema.py` 之间的字段交互已对齐。
- **状态更新**:
  - 更新了 `后端待解决文档.md` 的时间戳，确认 Task 1 和 Task 2 状态为 "已完成"。
