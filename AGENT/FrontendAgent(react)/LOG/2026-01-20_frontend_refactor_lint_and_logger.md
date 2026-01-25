# 前端改动日志

## [2026-01-20 21:48] Lint/Typecheck 收敛与 Logger 接入

**目标**
- 启动前端重构的第一步：收敛 `console.*` 直出、补齐 request 层类型、清理 lint 报错。

**变更范围**
- 请求与日志
  - 新增 `src/lib/logger.ts`：开发环境透传、生产环境静默。
  - 更新 `src/lib/request.ts`：增加 timeout/retry 选项、移除 any、统一错误解析与 logger 输出。
- UI/组件
  - 更新 `src/components/ui/input.tsx`：右侧图标容器允许交互（SearchBar 的清空按钮可点击），并增强无障碍属性。
  - 更新 `src/components/common/BottomInput.tsx`：增加快捷键开关使用、移除未使用图标引用。
  - 更新 `src/components/dashboard/*`：接入 SearchBar 与 QuickCreateMenu，消除未使用变量与 any。
  - 更新 `src/components/editor/DocumentEditor.tsx`：移除未使用 import，console 输出迁移到 logger。
  - 更新 `src/components/novel-detail/NovelDirectory.tsx`：清理未使用图标 import。
  - 更新 `src/components/settings/SettingsModal.tsx`：清理未使用 import，console 输出迁移到 logger，并移除类 API Key 占位符。
- Services
  - 更新 `src/services/documentService.ts`：补齐 `getDocumentDetail` 返回类型，移除 any。
  - 更新 `src/services/novelService.ts`：`createNovel` 对齐后端返回 `NovelOverviewDto` 并复用映射，移除 any。

**验证方式与结果**
- `npm run lint`：通过（仅保留 `next/no-img-element` 警告）。
- `npx tsc --noEmit`：通过。

## [2026-01-20 21:58] 修复 globals.css 构建报错

**目标**
- 解决 Next.js 构建时因 `globals.css` 中存在的孤儿 CSS 属性导致的 `CssSyntaxError`。

**变更范围**
- 全局样式
  - 更新 `src/app/globals.css`：注释掉第 149-182 行无选择器的孤儿样式代码（疑似 Sidebar/Drawer 残留代码），恢复构建正常。

**验证方式与结果**
- `npm run lint`：通过。

## [2026-01-20 22:14] CSS 重构为 Tailwind 与残留清理

**目标**
- 将项目中的原始 CSS 文件（`table-of-contents.css`, `document-editor.css`）重构为 Tailwind CSS，并清理 `globals.css` 中的残留代码。

**变更范围**
- 组件样式重构
  - 更新 `src/components/table-of-contents/TableOfContents.tsx`：移除 `table-of-contents.css` 引用，使用 inline Tailwind classes 重现原有样式（侧边栏抽屉、展开/收起动画）。
  - 更新 `src/components/editor/DocumentEditor.tsx`：移除 `document-editor.css` 引用，使用 Tailwind classes 重现原有编辑器布局与样式。
- 样式文件清理
  - 删除 `src/components/table-of-contents/table-of-contents.css`。
  - 删除 `src/components/editor/document-editor.css`。
  - 更新 `src/app/layout.tsx`：移除已删除 CSS 文件的引用。
  - 更新 `src/app/globals.css`：删除之前注释掉的孤儿 Sidebar 样式代码。

**验证方式与结果**
- `npm run lint`：通过。
- 样式逻辑：组件功能与布局逻辑保持一致（通过代码逻辑验证）。
