# 修复日志：创建卷时 React Key 警告修复

**时间**: 2026-01-31 00:34
**目标**: 修复在作品详情页创建新卷（Folder）时出现的 `Each child in a list should have a unique "key" prop` 警告，以及可能导致的 UI 渲染异常。
**变更范围**:
1.  `src/app/novels/[id]/page.tsx`: 
    -   修正 `handleCreateVolume` 方法中对 `createFolder` 返回值的字段访问。
    -   将错误的 `newFolder.node_id` 改为 correct `newFolder.id`。
    -   将错误的 `newFolder.node_name` 改为 correct `newFolder.name`。
    -   将错误的 `newFolder.sort_order` 改为 `volumes.length` (因为后端返回的 DTO 不包含排序字段，前端追加到末尾)。

**验证方式与结果**:
-   **代码检查**: 确认 `documentService.ts` 中的 `createFolder` 返回类型为 `NodeDTO`，其字段为 `id`, `name`, `type`，不包含 `node_id` 等旧字段。
-   **逻辑验证**: 修复后，新创建的 `Volume` 对象将拥有有效的 `id`，从而满足 React 列表渲染的 `key` 唯一性要求。

**问题根因**:
前端在处理 `createFolder` 的响应时，使用了错误的字段名（可能是旧版本 API 或笔误），导致 `id` 为 `undefined`，进而触发 React 的 Key 警告。此问题属于前端数据处理层。
