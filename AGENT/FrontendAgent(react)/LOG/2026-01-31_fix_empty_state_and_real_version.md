# 2026-01-31 修复空状态显示与真实版本号对接

## 1. 变更目标
1.  **修复空状态 Bug**: 当作品中无章节或未选中章节时，编辑器不应显示 "未命名文档" 或报错，而应显示引导页。
2.  **对接真实版本号**: 目录列表中的版本号不再使用模拟的 "v1.0"，而是从后端获取真实的 `now_version` 进行显示。

## 2. 变更范围

### 后端 (Backend)
-   **`src/api/routes/work/schema.py`**:
    -   `NodeDTO` 增加 `now_version` 字段 (str | None)。
-   **`src/services/work/service.py`**:
    -   `get_work_detail` 方法中，将数据库实体的 `now_version` 映射到 `NodeDTO`。

### 前端 (Frontend)
-   **`src/services/models.ts`**:
    -   更新 `NodeDTO` 接口，增加 `now_version` 字段。
-   **`src/types/work.ts`**:
    -   `ChapterVersion` 接口中 `versionNumber: number` 修改为 `version: string`。
    -   `Chapter` 接口增加 `currentVersionName?: string`。
-   **`src/services/workService.ts`**:
    -   `mapNodesToVolumesAndChapters` 函数中，使用 `node.now_version` 填充 `Chapter` 的 `currentVersionName` 和 `versions` 列表。
-   **`src/components/work-detail/WorkDirectory.tsx`**:
    -   修改版本号渲染逻辑，优先显示 `currentVersionName` 或 `version` 字符串，移除硬编码的 "v... .0" 格式。
-   **`src/components/editor/DocumentEditor.tsx`**:
    -   增加空状态检查：当 `currentChapterId` 为空时，不再渲染编辑器和保存按钮，而是显示 "开始您的创作之旅" 引导组件。
    -   引入 `FileText` 图标用于引导页。

## 3. 验证方式
1.  **空状态验证**:
    -   进入一个无章节的作品，或者删除所有章节。
    -   预期结果：右侧编辑区显示 "开始您的创作之旅" 引导页，无报错。
2.  **版本号验证**:
    -   在目录中查看章节。
    -   预期结果：版本标签显示真实的后端版本号 (如 "v1.0.1")，而非模拟的 "v1.0"。

## 4. 提交人
FrontendAgent(react)
