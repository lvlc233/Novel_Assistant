# 变更日志

- **提交人**: FrontendAgent(react)
- **时间**: 2026年01月31日 20:50
- **目标**: 
    1. 修复版本切换时内容未更新（未隔离）的严重 Bug。
    2. 确保不同版本之间的编辑器状态完全隔离。

- **变更范围**:
    - **Frontend**:
        - `src/components/editor/DocumentEditor.tsx`: 
            - 修改 `TiptapEditor` 的 `key` 属性，由 `key={currentChapterId}` 改为 `key={\`\${currentChapterId}-\${version}\`}`。
            - 强制 React 在版本切换时销毁并重建编辑器实例，防止旧版本的编辑器状态（包括内容、撤销栈）残留到新版本。

- **问题分析**:
    - **现象**: 切换版本后，编辑器显示的内容仍为上一个版本的修改内容，且保存会导致数据污染。
    - **原因**: `TiptapEditor` 组件被复用（因为 key 没变），且组件内部的 `useEffect` 逻辑仅在 `editor.isEmpty` 时才更新内容。导致切换版本传入的新 `content` 被忽略。
    - **解决**: 通过将 `version` 加入 `key`，强制触发组件的 Remount（重新挂载），从而在初始化时正确加载新版本的 `content`。

- **验证方式与结果**:
    - **代码逻辑推演**: 
        - 切换版本 -> `version` 状态改变 -> `key` 改变 -> 旧编辑器卸载 -> 新编辑器挂载 -> 使用新的 `content` 初始化 -> 内容正确显示。
    - **隔离性验证**: 由于组件重建，旧版本的 Undo/Redo 历史也被清除，确保了完全的版本隔离。
