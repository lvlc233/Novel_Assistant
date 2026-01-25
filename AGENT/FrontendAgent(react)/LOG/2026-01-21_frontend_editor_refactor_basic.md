# 编辑器重构日志

## 基本信息
- **时间**: 2026-01-21 12:20
- **目标**: 重构编辑器页面结构，移除 CopilotKit，恢复基础的 Tiptap 编辑功能和章节导航。
- **变更范围**:
    - `src/app/editor/page.tsx`: 页面入口重写，集成 `DocumentEditor`，并使用 `Suspense` 包裹。
    - `src/components/editor/DocumentEditor.tsx`: 核心编辑器容器，整合了 `TableOfContents` 和 `TiptapEditor`，处理数据加载与保存逻辑。
    - `src/components/editor/TiptapEditor.tsx`: 基础编辑器组件，添加 AI 助手预留入口提示。
    - `src/components/table-of-contents/TableOfContents.tsx`: 目录组件，支持卷/章折叠与切换。

## 验证方式与结果
1.  **验证方式**:
    - 从作品列表页点击任意作品卡片进入详情页，再点击“开始写作”或章节进入编辑器。
    - URL 应包含 `novelId` 和 `initialChapterId` 参数。
    - 页面应展示左侧目录（可收起/展开）、中间编辑器区域、底部保存按钮。
    - 编辑器应能正常输入内容，标题栏应显示章节标题。
    - 目录切换章节时，编辑器内容应同步更新。
    - 按 `Ctrl+S` 或点击保存按钮应能触发保存（Mock 模式下控制台输出日志）。

2.  **结果**:
    - 编辑器页面成功渲染，移除了旧版的 CopilotKit 依赖报错。
    - Tiptap 编辑器加载正常，Placeholder 提示已更新。
    - 目录导航功能恢复，章节切换顺畅。
    - 样式布局符合预期，移除了旧版 CSS 引用，全面转向 Tailwind CSS。
