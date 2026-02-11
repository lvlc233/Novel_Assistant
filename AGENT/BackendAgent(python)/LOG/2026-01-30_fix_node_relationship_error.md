# 变更记录

**时间**: 2026-01-30
**目标**: 修复 `WorkService.get_work_detail` 中访问不存在的 `relation_type` 字段导致的错误，并根据架构文档重新实现节点关系聚合逻辑。
**变更范围**:
1.  **Backend**:
    -   `src/services/work/service.py`:
        -   移除了访问 `NodeRelationshipSQLEntity.relation_type` 的代码，该字段在架构定义和数据库实体中均不存在。
        -   移除了废弃的 `parent_map` 构建逻辑（`NodeDTO` 已不再包含 `parent_id`）。
        -   重构了 `relationship` 列表的构建逻辑：现在会将属于同一个 `from_node_id` 的多个 `to_node_id` 聚合到一个 `EdgeDTO` 对象中，符合 `to_node_ids: List[UUID]` 的定义。

**验证方式与结果**:
-   **文档对照**: 确认《项目统一技术架构文档》中 `NodeRelationshipSQLEntity` 的定义确实不包含 `relation_type` 字段。
-   **逻辑验证**: 新的聚合逻辑正确实现了从“一对多记录”到“一对多列表”的转换，符合 `EdgeDTO` 的 Schema 定义。
-   **代码清理**: 移除了导致崩溃的无效属性访问代码。
