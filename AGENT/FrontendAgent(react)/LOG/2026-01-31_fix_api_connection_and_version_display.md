# 修复 API 连接与版本显示

## 基本信息
- **时间**: 2026-01-31 19:53
- **作者**: FrontendAgent(react)
- **目标**: 
  1. 修复前端连接到错误的后端接口问题 (使用 /work/{work_id}/document/{document_id} 替代 /document/{document_id})。
  2. 修复文档版本显示为 "UNKNOWN" 的问题。
  3. 适配后端拆分的文档更新接口 (基础信息 vs 内容版本)。

## 变更范围
1.  **frontend/novel-assistant-frontend/src/services/models.ts**:
    - 更新 `DocumentDetailResponse` 接口，增加 `current_version_id` 字段。
    
2.  **frontend/novel-assistant-frontend/src/services/documentService.ts**:
    - 移除 `getDocumentDetail` 中的 fallback 逻辑，强制要求 `work_id`。
    - 确保 `updateDocumentContent` 使用版本特定的更新接口。

3.  **frontend/novel-assistant-frontend/src/components/editor/DocumentEditor.tsx**:
    - 增加 `workId` prop 支持。
    - 修复 `fetchDoc` 逻辑，使用 `workId`。
    - 修复 `handleSave` 逻辑，传递 correct `version_id`。
    - 优化版本显示逻辑，使用后端返回的 `current_version_name`。

4.  **frontend/novel-assistant-frontend/src/app/editor/page.tsx**:
    - 从 URL 获取 `workId` 并传递给 `DocumentEditor`。

## 验证方式与结果
- **代码审查**: 确认 API 调用路径符合 `/PROJECT/DOCUMENTS/项目统一技术架构文档(重要).md` 规范。
- **单元测试**: 后端 `tests/api/test_node.py` 通过所有测试 (6 pass)。
- **逻辑验证**: 
    - 确认 `DocumentEditor` 只有在拥有 `workId` 时才能正常工作，避免了 `Node not found` 错误。
    - 确认版本号显示依赖于后端返回的 `now_version` 和 `current_version_id`，解决了 "UNKNOWN" 问题。
