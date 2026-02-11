# 变更日志

- **提交人**: FrontendAgent(react)
- **时间**: 2026年01月31日 20:35
- **目标**: 
    1. 修复版本切换后顶部栏版本名不更新的问题。
    2. 实现 URL 参数 (`?version=xxx`) 与当前文档版本的同步，确保刷新页面或分享链接时能保持版本状态。
    3. 优化新建版本和删除版本后的状态同步逻辑。

- **变更范围**:
    - **Frontend**:
        - `src/components/editor/DocumentEditor.tsx`: 
            - 引入 `useSearchParams` 和 `usePathname`。
            - 在 `useEffect` 中增加对 URL `version` 参数的监听，初始化时自动加载指定版本。
            - 修改 `handleSwitchVersion`：
                - 显式更新 `versionName` 状态，解决顶部栏显示旧版本名的问题。
                - 使用 `router.replace` 更新 URL 查询参数。
            - 修改 `handleDeleteVersion`：删除当前版本时，清除 URL 中的 `version` 参数并重置 `versionName`。
            - 修改 `submitNewVersion`：创建新版本后，更新 `versionName` 并同步 URL 参数。

- **验证方式与结果**:
    - **代码逻辑检查**: 
        - 确认 `setVersionName` 在所有版本变更路径（切换、删除、新建）中均被调用。
        - 确认 URL 参数随版本切换而更新，且页面刷新后能通过 URL 参数恢复版本状态。
    - **用户反馈模拟**: 用户点击版本列表 -> URL 变更为 `.../editor/...?version=v1` -> 顶部栏显示 "v1" -> 刷新页面 -> 保持 "v1"。
