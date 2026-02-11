# 变更记录: 动态化新建章节版本号

- **时间**: 2026-01-31 15:15
- **目标**: 避免新建章节时硬编码 `v1.0.0` 版本号，改为使用后端返回的真实版本信息，与编辑页面的逻辑保持一致。
- **变更范围**:
  - `src/services/models.ts`:
    - `DocumentResponse`: 增加 `now_version` 和 `current_version_id` 可选字段。
    - `NodeDTO`: 增加 `current_version_id` 字段。
  - `src/services/documentService.ts`:
    - `createDocument`: 从后端响应中提取版本信息，并填充到返回的 `NodeDTO` 中。Mock 实现也同步更新。
  - `src/app/works/[id]/page.tsx`:
    - `handleCreateChapter`: 不再使用硬编码的字符串，而是从 `createDocument` 返回的 `newDoc` 对象中获取 `current_version_id` 和 `now_version`。
- **验证方式**:
  - 创建新章节，观察前端是否正确显示后端返回的版本号（如果后端支持）。
  - 在当前 Mock 或后端未返回特定版本时，回退机制应确保功能不崩溃（默认显示 `v1.0.0`，但逻辑已改为动态获取优先）。
- **结果**:
  - 前端逻辑现在具备了处理不同初始版本号的能力，不再写死。
