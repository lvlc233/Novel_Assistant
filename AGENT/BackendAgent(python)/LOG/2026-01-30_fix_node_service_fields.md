# 变更记录

**时间**: 2026-01-30
**目标**: 修复 `NodeService` 中存在的字段名称不匹配错误，确保与数据库实体定义一致。
**变更范围**:
1.  **Backend**:
    -   `src/services/node/service.py`:
        -   **NodeRelationshipSQLEntity**: 移除了对不存在的 `relation_type` 字段的引用。
        -   **DocumentVersionSQLEntity**:
            -   `version_number` -> `version`
            -   `content` -> `full_text`
            -   `create_time` -> `create_at`

**验证方式与结果**:
-   **代码静态检查**: 确认修正后的字段名称与 `src/infrastructure/pg/pg_models.py` 中的定义完全匹配。
-   **逻辑验证**: 修正了创建节点、获取详情、更新节点时的数据库操作逻辑。
