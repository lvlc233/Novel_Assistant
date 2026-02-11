# 变更日志

- **提交人**: FrontendAgent(react)
- **时间**: 2026年01月31日 21:00
- **目标**: 实现文档自动保存功能，包括定时保存、切换版本/章节/退出时保存。

- **变更范围**:
    - **Frontend**:
        - `src/components/editor/DocumentEditor.tsx`:
            - 新增 `useEffect` 实现定时自动保存（防抖 2秒）。
            - 修改 `handleBack`：退出前检查 `!isSaved` 并触发保存。
            - 修改 `handleSwitchVersion`：切换版本前检查 `!isSaved` 并触发保存。
            - 修改 `WorkDirectory` 的 `onSelectChapter` 回调：切换章节前检查 `!isSaved` 并触发保存。

- **实现细节**:
    - **定时自动保存**:
        - 监听 `content`, `title`, `isSaved`, `currentChapterId`。
        - 当 `isSaved` 为 `false` 时，启动 2秒 倒计时。
        - 倒计时结束调用 `handleSave()`。
        - 若期间再次修改（依赖变化），清除旧定时器，重新计时（Debounce）。
    - **退出/切换保存**:
        - 在路由跳转、版本切换、章节切换的动作前，插入 `await handleSave()`。
        - 确保用户离开当前编辑上下文时，更改被持久化。

- **验证方式与结果**:
    - **代码逻辑推演**:
        - 自动保存：修改内容 -> `isSaved=false` -> Effect 启动定时器 -> 2s 后保存 -> `isSaved=true` -> Effect 停止。符合预期。
        - 切换版本：修改内容 -> 点击历史版本 -> `handleSwitchVersion` -> `!isSaved` 为真 -> `handleSave` -> 保存成功 -> 切换版本。符合预期。
        - 退出：修改内容 -> 点击返回 -> `handleBack` -> `!isSaved` 为真 -> `handleSave` -> 保存成功 -> 路由跳转。符合预期。
