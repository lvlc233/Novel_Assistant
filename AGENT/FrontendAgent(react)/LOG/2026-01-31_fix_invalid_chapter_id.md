# 2026-01-31 修复无效章节 ID 导致的编辑器空状态显示问题

## 1. 变更目标
- **修复 Bug**: 用户进入编辑器页面或删除所有章节后，即使目录为空，编辑器仍显示 "未命名文档"，而不是 "开始您的创作之旅" 引导页。
- **原因**: `currentChapterId` 可能被初始化为 URL 参数中的 ID（即使该 ID 已不存在），或者在删除操作后未被正确清除，且 `fetchDoc` 失败时未重置状态。

## 2. 变更内容

### 前端 (Frontend)
- **`src/components/editor/DocumentEditor.tsx`**:
    1.  **引入 `isStructureLoaded` 状态**: 用于标记目录结构（Volumes/Chapters）是否已加载完毕，避免在初始加载时误判。
    2.  **增加校验 Effect**: 当目录结构加载完成且 `currentChapterId` 存在时，检查该 ID 是否存在于 `volumes` 或 `orphanChapters` 中。若不存在（即 ID 无效或已删除），则：
        -   重置 `currentChapterId` 为 `null`。
        -   清空 URL 中的 `version` 参数。
        -   清空编辑器内容和标题。
    3.  **优化 `fetchDoc` 错误处理**: 在获取文档详情失败（如 404）时，显式将 `currentChapterId` 置为 `null`，确保不显示错误的编辑器状态。

## 3. 验证方式
1.  **场景一**: 直接访问带有一个不存在 `document_id` 的 URL。
    -   预期：页面加载后，自动识别 ID 无效，重置为空状态，显示引导页。
2.  **场景二**: 删除当前选中的章节，且该章节是最后一个章节。
    -   预期：删除后目录变为空，编辑器区域自动切换为引导页。

## 4. 提交人
FrontendAgent(react)
