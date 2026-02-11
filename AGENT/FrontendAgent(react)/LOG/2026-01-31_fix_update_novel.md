# 修复日志：修复作品更新功能与点击穿透

**时间**: 2026-01-31 00:22
**目标**: 修复作品卡片“更新”功能无效的问题，并解决点击修改/确认时误跳转至详情页的交互 Bug。
**变更范围**:
1.  `src/app/novels/page.tsx`: 
    -   重构 `handleEditNovel` 方法，移除了 `router.push` 跳转逻辑。
    -   对接 `updateNovel` API，实现真实的作品信息（标题、状态）更新。
    -   增加更新成功后的本地状态同步。
2.  `src/services/novelService.ts`:
    -   完善 `updateNovel` 方法，增加对 `state` (作品状态) 的支持，并正确映射前端状态到后端字段。
    -   更新 `UpdateNovelDto` 接口定义。
3.  `src/components/novel-manager/NovelCard.tsx`:
    -   在 `handleEditConfirm` and `handleDeleteConfirm` 中显式添加 `e.stopPropagation()`，防止点击事件冒泡触发外层卡片的导航逻辑。

**验证方式与结果**:
-   **交互验证**: 点击卡片上的修改按钮 -> 弹出编辑框 -> 点击确认 -> 调用后端 API 更新 -> 页面列表刷新且不发生页面跳转。
-   **API 验证**: 确认 `PATCH /work/{id}` 请求包含正确的 `state` 和 `name` 字段。
-   **代码检查**: 确认 `NovelCard` 内部按钮点击均已阻止冒泡。
