# 变更记录

**时间**: 2026-01-30
**目标**: 修复 `WorkService` 中 `WorkDetailResponse` 及其子对象 (`NodeDTO`, `EdgeDTO`) 的实例化字段与 `schema.py` 定义不一致导致的运行时错误。
**变更范围**:
1.  **Backend**:
    -   `src/services/work/service.py`:
        -   `get_work_detail`:
            -   修正 `WorkDetailResponse` 字段名: `works_meta` -> `meta`, `works_document` -> `document`, `works_documents_relationship` -> `relationship`.
            -   修正 `NodeDTO` 字段名: `node_id` -> `id`, `node_name` -> `name`, `node_type` -> `type`. 移除了 schema 中未定义的 `parent_id` 和 `sort_order`.
            -   修正 `EdgeDTO` 字段名: `from_nodes` -> `from_node_id`, `to_nodes` -> `to_node_ids`.
        -   `update_work_meta`: 修正 `request` 对象字段访问 (去除 `works_` 前缀).
        -   `list_work_plugins`: 修正 `WorkPluginMetaResponse` 字段名 (`plugin_id` -> `id`).
        -   `get_work_plugin_detail`: 修正 `WorkPluginDetailResponse` 字段名 (`plugin_id` -> `id`).
        -   `update_work_plugin`: 修改方法签名，显式接收 `plugin_id`，并修复了错误的属性访问 (`request.plugin_id`).
    -   `src/api/routes/work/router.py`:
        -   更新 `update_work_plugin` 调用，传入 `plugin_id`.

**验证方式与结果**:
-   **静态检查**: 确认 `service.py` 中的实例化代码与 `schema.py` 中的 Pydantic 模型定义一致。
-   **逻辑推断**: 修复了由于字段名不匹配导致的 Pydantic/TypeError 报错。
