# 变更记录: 修复节点模块路由和字段命名

- **时间**: 2026-01-30 10:59
- **目标**: 对齐项目统一技术架构文档，修正 Node 模块接口字段命名不一致的问题。
- **变更范围**:
    - `backend/src/api/routes/node/schema.py`:
        - 将所有 Request/Response 模型中的 `parent_node_id` 重命名为 `from_node_id`，以符合 SPECIFICATION 文档。
        - 将 `RelationshipResponse` 的字段 `nodes` 和 `edges` 重命名为 `document` 和 `relationship`，以符合文档和 Work 模块的定义。
    - `backend/src/api/routes/node/router.py`:
        - 更新所有引用了 `parent_node_id` 的代码，改为引用 `from_node_id`。
        - 更新 `RelationshipResponse` 的构造参数。
- **验证方式**: 静态代码分析。
- **结果**:
    - 接口字段名与文档一致。
    - 修复了潜在的 AttributeError (由于字段名不匹配)。
