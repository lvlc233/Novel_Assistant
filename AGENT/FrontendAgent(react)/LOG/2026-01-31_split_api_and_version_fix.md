# 变更日志

- **提交人**: FrontendAgent(react)
- **时间**: 2026年01月31日 20:15
- **目标**: 
    1. 完成文档更新接口拆分（基础信息 vs 内容版本）。
    2. 修复前端版本显示为 "UNKNOWN" 的问题。
    3. 强制前后端使用 `version` (string) 字段作为版本逻辑判断依据，不再使用 `id` (UUID)。
    4. 修复后端 API 路由缺失导致的 405 错误。

- **变更范围**:
    - **Backend**:
        - `src/services/node/service.py`: 增加 `get_document_version_detail_and_switch`，修改 `restore_version` 和 `update_document_version_content` 使用 `version` 字符串查找。
        - `src/api/routes/node/schema.py`: `DocumentDetailResponse` 增加 `current_version_id` (实为 version string) 字段。
        - `src/api/routes/node/router.py`: 增加 `PATCH .../version/{version_id}` 路由，修复 `DELETE` 路由参数传递。
        - `tests/api/test_node.py`, `tests/api/test_node_version.py`: 修复并验证测试用例。
    - **Frontend**:
        - `src/components/editor/DocumentEditor.tsx`: 
            - 移除 `versionId` 命名，统一使用 `versionStr`。
            - 修复版本下拉列表点击和删除事件传递 `v.id` 的错误，改为传递 `v.version`。
            - 修复版本显示逻辑，使用 `v.version` 查找。
        - `src/services/documentService.ts`: `getDocumentDetail` 返回值映射调整，确保 `document_version_id` 返回版本字符串。

- **验证方式与结果**:
    - **后端测试**: 运行 `pytest tests/api/test_node.py tests/api/test_node_version.py`，7 个测试用例全部通过。
    - **代码审查**: 确认前端 `DocumentEditor.tsx` 中不再使用 `v.id` 进行版本切换或删除操作。
    - **逻辑检查**: 确认后端通过 `version` 字符串查找版本，避免了 UUID 格式校验错误。
