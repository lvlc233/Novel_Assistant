# 变更日志: 修复版本管理逻辑与显示问题

**时间**: 2026-01-31 14:45
**执行人**: BackendAgent(python)
**目标**: 解决前端版本显示为随机字符串的问题，并修正后端版本逻辑以符合用户需求（版本字段存储名称，但API交互使用ID）。

## 变更范围
1.  **Backend (`backend/src/services/node/service.py`)**:
    -   修改 `get_node_detail`、`get_document_detail_by_id`、`update_node`、`get_document_version_detail_and_switch`:
        -   确保 `now_version` 字段在 API 响应中返回 **版本ID (UUID)**，而不是 **版本名称**。
        -   保持数据库中 `NodeSQLEntity.now_version` 字段存储 **版本名称** 的逻辑不变（符合用户"版本字段即版本名"的定义）。
        -   在 `create_document_version` 中保留若未提供名称则生成随机字符串的逻辑。
2.  **Frontend (`frontend/novel-assistant-frontend/src/components/editor/DocumentEditor.tsx`)**:
    -   修复 `versionList` 状态的 TypeScript 定义：从 `string[]` 改为 `DocumentVersionItem[]`。
    -   这解决了前端在使用 `versionList.find` 时因类型不匹配（或隐式错误）导致无法正确找到版本对象并显示版本名称的问题。

## 验证方式与结果
-   **逻辑验证**:
    -   前端通过 API 获取 `DocumentDetailResponse`，其中 `now_version` 为 UUID。
    -   前端 `setVersion(UUID)`。
    -   前端 `versionList` 包含 `{id: UUID, version: "v1.0"}`。
    -   前端渲染逻辑 `versionList.find(i => i.id === version)` 成功匹配 UUID。
    -   前端显示 `v.version` ("v1.0")。显示正确。
    -   API 调用 `switchVersion(version)` 发送 UUID，后端 `get_document_version_detail_and_switch` 接收 UUID 并查找主键，逻辑正确。
-   **结果**: 修复了版本显示乱码（显示了UUID）的问题，并理顺了前后端关于版本ID与版本名称的交互逻辑。
