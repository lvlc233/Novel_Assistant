# 2026-01-30 Frontend API Alignment

## 变更概述
对齐前端接口与《项目统一技术架构文档(重要).md》。

## 修改文件
1.  `src/services/models.ts`:
    *   更新 `WorkMetaDTO`, `NodeDTO`, `EdgeDTO` 等定义。
    *   添加 `DocumentUploadRequest`, `NodeCreateRequest` 等 DTO。
    *   移除旧的 `sort_order`, `fater_node_id` 等字段。

2.  `src/services/novelService.ts`:
    *   API 路径从 `/works` 更新为 `/work`。
    *   实现 `mapNodesToVolumesAndChapters` 使用 `EdgeDTO` 构建树状结构。
    *   更新 `createNovel`, `updateNovel` 的 payload 字段。

3.  `src/services/documentService.ts`:
    *   API 路径从 `/works` 更新为 `/work`。
    *   API 端点更新为 `/work/{id}/node` 和 `/work/{id}/document`。
    *   更新 Request Payload 字段 (`fater_node_id` -> `from_node_id` 等)。
    *   更新返回值 DTO 结构。

4.  `src/app/novels/[id]/page.tsx` & `src/components/editor/DocumentEditor.tsx`:
    *   适配 `createFolder` 和 `createDocument` 的新返回值结构 (`node_id` -> `id`, `node_name` -> `name`)。

## 验证
*   静态代码扫描确认无旧 API 路径残留。
*   确认关键字段引用已更新。
