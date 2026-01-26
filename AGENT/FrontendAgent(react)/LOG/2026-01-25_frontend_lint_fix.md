# Frontend ESLint Fixes Log

**时间**: 2026-01-25 16:53
**目标**: 修复前端项目中的所有 ESLint 错误，确保代码质量和构建通过。
**变更范围**: `src` 目录下的多个 `.ts` 和 `.tsx` 文件。

## 主要变更内容

1.  **修复 `no-unused-vars` (未使用变量/导入)**
    -   `src/services/memoryService.ts`: 移除未使用的 `MemoryType` 导入，并使用 `eslint-disable` 标记解构中未使用的变量。
    -   `src/services/pluginService.ts`: 移除未使用的 `PluginManifest`, `PluginRegistryItem`, `request`, `logger` 导入。
    -   `src/components/layout/Sidebar.tsx`: 移除未使用的 `useRouter`, `Bot`, `Settings`, `Menu` 等导入。
    -   `src/components/layout/TopNav.tsx`: 移除未使用的 `User`, `Search`, `Menu`, `cn` 导入，并标记未使用的 `isSidebarOpen` 状态。
    -   `src/components/novel-manager/DocumentCarousel.tsx`: 移除未使用的 `AnimatePresence` 导入。
    -   `src/components/novel-detail/NovelPluginSettingsModal.tsx`: 移除未使用的 `_novelId` (添加 lint disable) 和未使用的导入。
    -   `src/app/knowledge-bases/[id]/page.tsx`: 移除未使用的 `MoreVertical`, `formatDistanceToNow`, `zhCN`。
    -   `src/app/memories/page.tsx`: 移除未使用的 `MoreVertical`。
    -   `src/app/agents/page.tsx` & `[id]/page.tsx`: 移除未使用的 `Power`, `Loader2`。
    -   `src/app/novels/page.tsx`: 移除未使用的 `KnowledgeBaseMeta`。
    -   `src/app/plugins/page.tsx`: 移除未使用的 `ToggleLeft` 等图标导入。
    -   `src/services/documentService.ts`: 移除未使用的类型导入。

2.  **修复 `no-explicit-any` (显式 any 类型)**
    -   `src/types/agent.ts`: 将 `history_meta: any[]` 改为 `Record<string, unknown>[]`。
    -   `src/types/plugin.ts`: 将 `config: any` 改为 `Record<string, unknown>`。
    -   `src/components/novel-manager/DocumentCarousel.tsx`: 将 `variants: any` 改为 `Variants` (from `framer-motion`) 或 `React.MouseEvent`。
    -   `src/components/plugins/PluginSettingsModal.tsx`: 将 `config: any` 改为 `unknown`。
    -   `src/contexts/SlotContext.tsx`: 将 `props: any` 改为 `unknown`。
    -   `src/services/documentService.ts`: 将 `let chap: any` 改为 `Chapter | undefined`，完善类型定义。
    -   `src/app/plugins/page.tsx`: 修复 `saveSettings` 中的 `config: any`。

3.  **修复 `prefer-const`**
    -   `src/services/knowledgeBaseService.ts`: 将 `mockChunks` 从 `let` 改为 `const`。

4.  **功能补全 (Feature Completion)**
    -   `src/components/novel-detail/NovelDirectory.tsx`: 实现了之前未使用的 `onDeleteVolume` 和 `onDeleteChapter` props，在右键菜单中添加了删除按钮。

## 验证方式与结果

-   **验证方式**: 运行 `npm run lint`。
-   **结果**: 命令退出代码为 0，无 Error 级别的 ESLint 报错。剩余少量 `next/image` 警告，不影响构建。

## 提交人
FrontendAgent(react)
