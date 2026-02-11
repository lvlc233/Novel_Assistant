# 变更日志

- **提交人**: FrontendAgent(react)
- **时间**: 2026年01月31日 20:25
- **目标**: 
    1. 修复前端版本切换可能失败的问题（特别是包含中文或特殊字符的版本名）。
    2. 增加前端调试日志以追踪版本切换流程。

- **变更范围**:
    - **Frontend**:
        - `src/services/documentService.ts`: 
            - 在 `getDocumentDetail` 中对 `version_id` 进行 `encodeURIComponent` 编码，防止特殊字符导致请求失败。
            - 增加日志输出，打印请求的版本ID及编码后的结果。
        - `src/components/editor/DocumentEditor.tsx`: 
            - 在 `handleSwitchVersion` 中增加详细的日志（开始切换、获取成功、失败报错）。
            - 在 `fetchVersions` 中增加日志，打印获取到的版本列表。
            - 增加 `console.log/warn/error` 以便在浏览器控制台直接查看问题。

- **验证方式与结果**:
    - **代码逻辑检查**: 确认 `encodeURIComponent` 正确应用于 URL 路径参数。
    - **日志追踪**: 通过新增的日志可以明确看到版本切换时的参数传递和 API 响应情况。
