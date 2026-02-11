# 2026-01-31 优化作品详情页布局与功能

## 1. 变更目标
- **优化布局**: 解决作品详情页中目录和正文区域过于狭窄的问题，使其能够占据页面剩余空间。
- **修复版本显示**: 修正预览页中历史版本列表版本号显示错误（undefined）的问题，对接真实版本数据。
- **功能精简与增强**:
    -   移除作品头部的字数统计。
    -   增加作品信息（封面、标题、简介）的编辑入口。

## 2. 变更内容

### 前端 (Frontend)
- **`src/app/works/[id]/page.tsx`**:
    -   调整 CSS Flex 布局，给主内容区域增加 `flex-1 overflow-hidden` 和 `h-full` 属性，确保目录和预览区域撑满剩余高度。
    -   传递 `onEdit` 回调给 `WorkHeader`，用于触发 `WorkSettingsModal`。
- **`src/components/work-detail/WorkHeader.tsx`**:
    -   移除字数统计显示部分。
    -   新增 `onEdit` 属性，并在右上角（Hover 时或移动端常显）增加编辑按钮图标。
- **`src/components/work-detail/ChapterPreview.tsx`**:
    -   修复版本号显示逻辑：优先使用 `v.version` 字段，若为空则回退到 `v.versionNumber`，解决 `vundefined.0` 问题。

## 3. 验证方式
1.  **布局验证**: 进入作品详情页，确认下方目录和预览区域高度自适应，不再被压缩成一小行。
2.  **版本列表验证**: 点击预览页右上角的版本下拉框，确认显示的版本号为真实数据（如 `v1.0.1`）。
3.  **编辑功能验证**: 鼠标悬停在作品头部区域，点击出现的编辑图标，确认能弹出设置弹窗并修改信息。

## 4. 提交人
FrontendAgent(react)
