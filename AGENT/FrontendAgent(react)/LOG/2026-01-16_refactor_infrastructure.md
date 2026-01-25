# 变更日志

## [2026-01-16 14:27] Frontend Refactoring

**目标**: 移除 CopilotKit，重构前端架构以符合 Tiptap + AI SDK + LangGraph 规范。

**变更范围**:
1. **依赖管理**:
   - 移除: `@copilotkit/*`, `@langchain/langgraph-cli`
   - 新增: `zustand`, `@tanstack/react-query`, `ai`, `@tiptap/*`
2. **核心工具**:
   - 新增 `src/lib/utils.ts`: 实现 `cn` (Tailwind class merger)。
   - 新增 `src/lib/request.ts`: 统一 API 请求客户端 (拦截器、Token 注入、错误处理)。
   - 更新 `src/config/index.ts`: 支持环境变量配置。
3. **服务层重构**:
   - 重构 `src/services/novelService.ts` 和 `src/services/documentService.ts`: 使用统一 `request` 客户端，移除冗余 fetch 代码。
4. **组件清理**:
   - 删除 `src/components/Sidebar` (CopilotKit 相关)。
   - 删除 `src/components/CustomInputAddButton.tsx`。
   - 清理 `src/app/layout.tsx` 和 `globals.css` 中的 CopilotKit 引用。
   - 替换 `src/app/editor/page.tsx` 为重构占位符。

**验证方式**:
- 运行 `npm install` 成功。
- 运行 `npx tsc --noEmit` 通过，无类型错误。

**提交人**: FrontendAgent(react)
