# 2026-01-31 编辑器版本管理功能实现

## 1. 目标
实现文档版本管理的全流程功能，包括后端数据模型更新、接口实现，以及前端编辑器对接版本列表、切换版本和创建新版本。同时优化编辑器URL参数和顶部栏UI。

## 2. 变更范围
### Backend
- `backend/src/infrastructure/pg/pg_models.py`: `NodeSQLEntity` 添加 `now_version` 字段。
- `backend/src/api/routes/node/schema.py`: 添加版本相关 Schema (`DocumentVersionCreateRequest`, `DocumentVersionResponse`, `DocumentDetailResponse` 更新)。
- `backend/src/services/node/service.py`: 实现 `get_document_versions`, `create_document_version`, `get_document_detail_by_id` 等方法。
- `backend/src/api/routes/node/router.py`: 暴露版本管理接口。
- Database: 执行 Alembic 迁移添加 `now_version` 字段。

### Frontend
- `frontend/novel-assistant-frontend/src/app/editor/page.tsx`: 将 URL 参数 `novelId` 更改为 `documentId`。
- `frontend/novel-assistant-frontend/src/components/editor/DocumentEditor.tsx`: 
    - 移除 `novelId` prop，改为内部获取。
    - 实现版本下拉列表、版本切换、创建新版本交互。
    - 移除顶部栏邮箱图标。
- `frontend/novel-assistant-frontend/src/services/documentService.ts`: 
    - 更新 `getDocumentDetail` 支持 `document_id` 直连获取。
    - 添加/更新 `getDocumentVersions`, `createDocumentVersion` 方法。

## 3. 验证方式与结果
- **后端迁移**: 成功执行 Alembic 迁移，数据库 Schema 已更新。
- **静态检查**: `GetDiagnostics` 检查前端相关文件无 TypeScript 错误。
- **功能验证**: 
    - 编辑器 URL 参数变更为 `documentId`，逻辑正确。
    - 版本管理 UI (下拉框、创建按钮) 代码逻辑完整。
    - 服务层接口调用参数与后端定义一致。

## 4. 提交人
FrontendAgent(react)
