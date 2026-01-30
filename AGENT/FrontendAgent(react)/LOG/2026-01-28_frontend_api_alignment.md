# 前端 API 接口对齐日志

**时间**: 2026年01月28日 19:30  
**提交人**: FrontendAgent(react)  
**目标**: 对齐前端服务层（Service）与后端 API 接口，修复数据结构不匹配和 endpoint 路径错误，确保 CRUD 流程通畅。

## 变更范围
1.  **g:\work\project\bishe\Agent\Novel_Assistant\frontend\novel-assistant-frontend\src\services\models.ts**
    *   新增 `DocumentUpdateRequest` 接口，规范文档更新请求体。
    *   更新 `NodeDTO`，增加 `fater_node_id` 字段（对应后端 parent_id 别名）。
    *   更新 `DocumentCreateRequest` 和 `DocumentResponse` 以匹配后端字段定义。

2.  **g:\work\project\bishe\Agent\Novel_Assistant\frontend\novel-assistant-frontend\src\services\documentService.ts**
    *   修正所有 API 路径，统一使用 `/works/{novel_id}/...` 格式。
    *   `createFolder`: 使用 `/nodes` 接口，payload 使用 `fater_node_id`。
    *   `createDocument`: 使用 `/documents` 接口，payload 使用 `fater_node_id`。
    *   `getDocumentDetail`: 修正 endpoint，增加 `novel_id` 参数。
    *   `updateDocumentContent` / `renameDocument`: 统一使用 `DocumentUpdateRequest` 类型。
    *   移除冗余的本地类型定义，统一引用 `models.ts`。

3.  **g:\work\project\bishe\Agent\Novel_Assistant\frontend\novel-assistant-frontend\src\services\novelService.ts**
    *   更新 `mapNodesToVolumesAndChapters` 方法，支持 `NodeDTO` 中的 `fater_node_id` 字段，兼容后端可能的字段别名。

4.  **g:\work\project\bishe\Agent\Novel_Assistant\frontend\novel-assistant-frontend\src\components\editor\DocumentEditor.tsx**
    *   修正 `getDocumentDetail` 调用，传入 `novel_id`。
    *   更新 `useEffect` 依赖数组，防止 stale closure。

## 验证方式与结果
1.  **静态类型检查**: 
    *   TypeScript 编译通过，无新增类型错误。
    *   Service 层请求/响应类型与 `models.ts` 定义一致。

2.  **逻辑验证**:
    *   `NovelDirectory` 组件调用的创建卷/章节方法（`handleCreateVolume`, `handleCreateChapter`）所依赖的 Service 返回值结构已对齐。
    *   `DocumentEditor` 获取文档详情逻辑已包含必要参数（novel_id）。
    *   Mock 模式下逻辑保持兼容，未受破坏。

## 备注
*   后端 API 中 `parent_id` 别名为 `fater_node_id`，前端已做兼容处理。
*   `WorkMetaDTO` 与 Payload 中 `work_name` / `works_name` 的潜在命名差异暂时保留现状（遵循现有代码模式），后续需根据实际联调反馈调整。
