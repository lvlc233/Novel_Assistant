# 提交说明

- 范围：`backend/src/plugin/agent_manager/document_helper/agent/`、`backend/src/plugin/agent_manager/document_helper/plugin.py`、`backend/src/plugin/agent_manager/plugin.py`、`frontend/novel-assistant-frontend/src/components/editor/`
- 新增文档助手工具组：
  - `read_document_info`
  - `patch_document_content`
  - `manage_outline`
- 文档助手 Agent 运行链路改为 `create_agent`，并接入 `HumanInTheLoopMiddleware` 与 `InMemorySaver`。
- 文档助手 `chat` 改为通过 Agent 调用，输出结构化事件：`assistant_chunk`、`tool_dispatch`、`tool_result`、`hitl_interrupt`。
- 新增 `resume_human_review` 操作，支持 `approve/edit/reject` 三种恢复决策。
- Agent 管理器新增 `proxy_resume_agent_review`，用于代理审核恢复请求。
- 前端 `AIAssistant` 新增审核决策调用后端恢复链路，并消费恢复后的流式事件。
- 工具执行链路已接入 `NodeService`，`patch_document_content` 与 `manage_outline` 在审批后可执行真实数据库写入。
- 前端新增工具结果后的文档刷新事件广播，`DocumentEditor` 监听事件后自动重拉文档与版本，避免“库已更新但编辑器未刷新”。
- 文档助手执行链路改为 `astream_events` 事件流，补齐 token/tool/hitl 实时事件输出，不再只在调用结束后一次性返回。
- 前端通过全局上下文主动透传 `document_content/document_title/version_id` 到代理层与 Agent，避免读取到非当前文档快照。
- 前端聊天渲染改为“消息片段时间线”，按事件顺序交错渲染文本与工具卡片，支持 `chat -> tool -> chat` 的连续可视流。
- 工具调度事件改为仅基于 `on_tool_start` 发出，移除 `on_chat_model_stream.tool_call_chunks` 的重复调度输出，解决同一次工具出现 `""` 与 `{}` 双入参展示问题。
- 前端新增会话级 HITL 待处理状态机（pending/resolving），在人审未完成前阻止继续发送消息，确保“先审批再继续执行”。

# 风险点

- 当前 HITL 的 `checkpointer` 使用进程内 `InMemorySaver`，服务重启后中断上下文会丢失。
- `manage_outline` 的 `payload` 目前以 JSON 字符串为输入约定，模型生成不稳定时可能触发解析失败。
- 前端 lint 仍存在大量历史存量问题，未在本次提交内清理。
- 前端会话切换后若存在历史未完成人审，需要依赖当前会话状态正确恢复，避免误阻塞其他会话。

# 验证结果

- `python -m py_compile` 校验通过：
  - `document_helper/agent/schema.py`
  - `document_helper/agent/tools.py`
  - `document_helper/agent/agent.py`
  - `document_helper/plugin.py`
  - `agent_manager/plugin.py`
- `npm run lint` 已执行，存在仓库历史问题，与本次改动功能链路无直接阻塞关系。
- `npm run typecheck` 脚本不存在（前端当前未提供该脚本）。

---

# 增量提交说明（2026-03-08 08:03）

- 范围：`backend/src/plugin/agent_manager/document_helper/plugin.py`、`backend/src/plugin/agent_manager/plugin.py`
- 历史存储策略统一为 checkpoint，移除 `session_histories` 的读写与回退逻辑。
- `document_helper` 会话列表改为直接读取 `DOCUMENT_HELPER_CHECKPOINTER` 中的 `messages`。
- `document_helper.chat` 移除 `_append_session_turn` 持久化路径，避免与 checkpoint 双写。
- `AgentManager.get_agent_info` 移除 config 历史回退分支，仅消费 checkpoint 会话消息。

# 增量风险点

- `document_helper` 仍使用 `InMemorySaver`，服务重启后历史不可恢复；当前仅保证“单一来源是 checkpoint”。
- 老会话若仅存在 config 历史且无 checkpoint，将不再在邮箱历史中展示旧消息。

# 增量验证结果

- `uv run ruff check src`：失败，存在仓库历史存量问题（非本次引入）。
- `uv run ruff check src/plugin/agent_manager/document_helper/plugin.py src/plugin/agent_manager/plugin.py`：失败，存在既有 D102/T201 规则问题（非本次引入）。
- `uv run mypy src/plugin/agent_manager/document_helper/plugin.py src/plugin/agent_manager/plugin.py`：失败，存在既有严格类型问题（非本次引入）。
- `python -m compileall src/plugin/agent_manager/document_helper/plugin.py src/plugin/agent_manager/plugin.py`：通过。

---

# 增量提交说明（2026-03-08 08:10）

- 范围：`backend/src/plugin/agent_manager/project_helper/plugin.py`
- `project_helper.chat` 从 `astream(..., stream_mode="messages")` 切换为 `astream_events(..., version="v2")`。
- 流式输出协议统一为 `event_type`：`assistant_chunk`、`tool_dispatch`、`tool_result`。
- 增加无分片文本时的状态兜底：从 `aget_state` 读取 `response` 并补发 `assistant_chunk`。
- 增加异常输出：`{"status":"error","message":"..."}`，与现有前端错误分支兼容。

# 增量风险点

- `project_helper` 当前图节点未绑定工具，`tool_dispatch/tool_result` 在现阶段通常为空事件分支。
- `project_helper` 文件本身存在较多历史 lint/mypy 问题，本次未做结构性清理。

# 增量验证结果

- `python -m compileall src/plugin/agent_manager/project_helper/plugin.py`：通过。
- `uv run ruff check src/plugin/agent_manager/project_helper/plugin.py`：失败，存在历史存量规则问题（含 D1xx/F811/E402 等，非本次引入）。
- `uv run mypy src/plugin/agent_manager/project_helper/plugin.py`：失败，存在历史存量严格类型问题（含 no-redef/no-untyped-def 等，非本次引入）。

---

# 增量提交说明（2026-03-08 08:18）

- 范围：`backend/src/plugin/agent_manager/project_helper/agent/schema.py`、`backend/src/plugin/agent_manager/project_helper/agent/agent.py`、`backend/src/plugin/agent_manager/project_helper/plugin.py`
- `ProjectHelperAgentState` 改为以 `TypedDict + add_messages` 承载状态，核心字段对齐为 `messages/context/page_id`。
- `project_helper` 节点改为消费 LangChain Messages（`SystemMessage + messages`），并返回字段增量更新字典，不再依赖 `query/response` 直传状态。
- `project_helper.chat` 入参改为 `{"messages":[HumanMessage(...)],"context":"","page_id":...}`，与新状态结构对齐。
- `project_helper.chat` 兜底读取从 `response` 切换为遍历状态 `messages` 中的 `ai` 消息内容。

# 增量风险点

- `project_helper` 依赖的旧文件仍存在历史结构问题（重复类型定义、导入顺序、装饰器类型推断等），本次未做全量清理。
- 由于当前图无工具绑定，`tool_dispatch/tool_result` 在大多数会话中仍不会出现。

# 增量验证结果

- `python -m compileall src/plugin/agent_manager/project_helper/agent/schema.py src/plugin/agent_manager/project_helper/agent/agent.py src/plugin/agent_manager/project_helper/plugin.py`：通过。
- `uv run ruff check src/plugin/agent_manager/project_helper/agent/schema.py src/plugin/agent_manager/project_helper/agent/agent.py src/plugin/agent_manager/project_helper/plugin.py`：失败，主要为历史存量规则问题（D1xx/F811/E402 等）。
- `uv run mypy src/plugin/agent_manager/project_helper/agent/schema.py src/plugin/agent_manager/project_helper/agent/agent.py src/plugin/agent_manager/project_helper/plugin.py`：失败，主要为历史存量严格类型问题（no-redef/no-untyped-def 等）。

---

# 增量提交说明（2026-03-08 08:29）

- 范围：`frontend/novel-assistant-frontend/src/components/editor/AIAssistant.tsx`
- 新增前端统一事件归一化层：`normalizeAgentEvent`，将 `assistant_chunk/tool_dispatch/tool_result/hitl_interrupt/error` 收敛为单一路径处理。
- 新增会话历史快照同步：`syncAgentHistorySnapshot`，支持从后端恢复并更新会话列表、当前会话、消息缓存。
- 会话生命周期补齐：切换会话后强制同步；创建会话后回填后端ID；新增删除会话动作并回退到可用会话。
- 文档同步渲染触发统一保留在 `tool_result` 分支，覆盖普通聊天与HITL恢复两条链路。

# 增量风险点

- `AIAssistant.tsx` 仍有历史 ESLint 规则问题（`no-explicit-any`、`no-unused-vars` 等），本次以功能闭环优先，未做全量类型治理。
- 删除会话依赖后端 `delete_agent_session` 能力；若后端未实现，将自动回退到前端本地删除路径。

# 增量验证结果

- `npm run lint`：失败，存在仓库范围历史前端存量问题（非本次单点引入）。
- `npx tsc --noEmit`：失败，存在仓库范围历史类型问题（非本次单点引入）。
- `npx tsc --noEmit --pretty false | Select-String "AIAssistant.tsx"`：通过（当前改造文件无新增TS错误）。
- `npx eslint src/components/editor/AIAssistant.tsx`：失败，存在该文件历史 lint 问题（`no-explicit-any` 等）。

---

# 增量提交说明（2026-03-08 08:35）

- 范围：`frontend/novel-assistant-frontend/src/components/editor/AIAssistant.tsx`
- 会话状态改造为统一 reducer：`AgentSessionStore + reduceAgentSessionStore`，集中管理 `sessions/currentSession/messagesBySession`。
- 会话读写路径统一走 reducer action：快照恢复、会话切换、新建会话、删除会话、会话消息同步。
- 新增会话级流防串流保护：引入 `activeStreamRunRef + activeStreamSessionKeyRef`，仅允许当前会话当前流实例写入消息/工件。
- 切换会话与删除会话时，若存在进行中的流会先主动停止，避免跨会话事件污染与错误文档刷新。

# 增量风险点

- `AIAssistant.tsx` 仍存在历史 ESLint 规则问题（`no-explicit-any` 等），本次未做全面类型收敛。
- 前端 fallback 的 `agentService.chatStream` 路径未携带完整 artifact 事件语义，后续需与 proxy 协议进一步统一。

# 增量验证结果

- `npx tsc --noEmit --pretty false | Select-String "AIAssistant.tsx"`：通过（改造文件无新增 TS 报错）。
- `npx eslint src/components/editor/AIAssistant.tsx`：失败，存在文件历史 lint 问题（`no-explicit-any`、`no-unused-vars`、hooks 依赖告警）。
- `npm run lint`：失败，存在仓库范围历史前端存量问题（非本次单点引入）。
- `npx tsc --noEmit`：失败，存在仓库范围历史类型问题（非本次单点引入）。

---

# 增量提交说明（2026-03-08 08:59）

- 范围：`backend/src/plugin/agent_manager/document_helper/agent/agent.py`
- 修复文档助手运行时上下文空值问题：新增 `_resolve_runtime_context`，优先使用 `runtime.context`，缺失时回退 `build_agent(runtime_context)` 的静态上下文。
- 修复图节点上下文注入断裂：`build_agent` 改为闭包节点 `_call_model/_tool_gate`，显式将 `runtime_context` 传入节点执行函数，避免运行期出现 `NoneType` 下标访问。
- 在 `call_model/tool_gate` 增加关键字段校验（`model_name/api_key/base_url/session`），缺失时抛出明确错误而非隐式 `NoneType` 崩溃。

# 增量风险点

- `session` 仍依赖插件注入，如果依赖注入链路异常会触发新的显式错误信息（可定位，但仍需修复上游注入）。
- 当前未新增自动化回归测试用例，后续建议补充针对“上下文缺失/存在”的节点级测试。

# 增量验证结果

- `uv run python -c "import asyncio; ... asyncio.run(build_agent(runtime)); print('ok')"`：通过（图可编译）。
- `uv run python -m ruff check src/plugin/agent_manager/document_helper/agent/agent.py src/plugin/agent_manager/document_helper/plugin.py`：失败，存在仓库存量规则问题（docstring/import 排序/注解风格）。
- `uv run python -m mypy src/plugin/agent_manager/document_helper/agent/agent.py`：失败，存在仓库存量类型问题（`ChatOpenAI` 参数签名、严格注解要求等）。

---

# 增量提交说明（2026-03-08 08:54）

- 范围：`frontend/novel-assistant-frontend/src/services/agentService.ts`、`frontend/novel-assistant-frontend/src/types/agent.ts`、`frontend/novel-assistant-frontend/src/components/editor/AIAssistant.tsx`、`frontend/novel-assistant-frontend/src/contexts/MailContext.tsx`、`frontend/novel-assistant-frontend/src/app/agents/[id]/page.tsx`
- `agentService.chatStream` 新增标准事件回调 `onEvent`（兼容原有 `onMessage`），统一产出 `assistant_chunk/tool_dispatch/tool_result/hitl_interrupt/error/done` 事件。
- 新增 `AgentChatRuntimeEvent` 类型，作为前端 runtime 事件协议，降低各消费端对 SSE 原始格式的耦合。
- AIAssistant fallback 路径改为消费 `onEvent`，移除本地 SSE 行解析逻辑。
- MailContext 与 AgentChatPage 统一改为 `onEvent` 消费，移除重复的 chunk 解析代码，保留运行实例隔离与增量渲染行为。

# 增量风险点

- `agentService.ts` 自身存在历史 lint 存量（未使用导入、`any` 类型等），本次未做全量清理。
- 旧后端若返回非约定格式，当前会降级为 `other` 事件，不会中断主流程，但可能丢失结构化展示细节。

# 增量验证结果

- `npx tsc --noEmit --pretty false | Select-String "agentService.ts|AIAssistant.tsx|MailContext.tsx|app/agents/\\[id\\]/page.tsx|types/agent.ts"`：通过（目标文件无新增 TS 报错）。
- `npx eslint src/services/agentService.ts src/components/editor/AIAssistant.tsx src/contexts/MailContext.tsx src/app/agents/[id]/page.tsx src/types/agent.ts`：失败，存在历史 lint 问题（`agentService` 未使用项/`any`、`AIAssistant` 历史 `any`、`MailContext` 历史未使用变量）。
- `npm run lint`：失败，存在仓库范围历史前端存量问题（非本次单点引入）。
- `npx tsc --noEmit`：失败，存在仓库范围历史类型问题（非本次单点引入）。

---

# 增量提交说明（2026-03-08 08:48）

- 范围：`frontend/novel-assistant-frontend/src/contexts/MailContext.tsx`、`frontend/novel-assistant-frontend/src/app/agents/[id]/page.tsx`
- `MailContext.sendToAgent` 接入统一旧流解析：新增 `normalizeLegacyEventToText/parseLegacyChunkToTexts`，兼容纯文本与 `data:` SSE，统一转为文本片段增量渲染。
- `MailContext` 将 Agent 回复从“每 chunk 一条消息”改为“同一消息持续追加”，避免流式期间邮箱消息刷屏。
- `AgentChatPage` 接入统一旧流解析并支持结构化事件文本化展示（tool dispatch/result、HITL、error）。
- `AgentChatPage` 增加 `activeRunRef` 防串流，停止时清理活跃运行标记，避免过期流片段写入当前会话。

# 增量风险点

- 旧接口返回事件结构仍可能随后端版本变化，当前解析策略优先兼容 `message_chunk`、`data:` 与纯文本三类常见形态。
- `MailContext.tsx` 存在历史 lint 告警（`setIsMailEnabled` 未使用），本次未做无关清理。

# 增量验证结果

- `npx tsc --noEmit --pretty false | Select-String "AIAssistant.tsx|MailContext.tsx|app/agents/\\[id\\]/page.tsx"`：通过（目标文件无新增 TS 报错）。
- `npx eslint src/components/editor/AIAssistant.tsx src/contexts/MailContext.tsx src/app/agents/[id]/page.tsx`：失败，存在历史 lint 问题（AIAssistant 的 `no-explicit-any`，MailContext 的未使用变量）。
- `npm run lint`：失败，存在仓库范围历史前端存量问题（非本次单点引入）。
- `npx tsc --noEmit`：失败，存在仓库范围历史类型问题（非本次单点引入）。

---

# 增量提交说明（2026-03-08 08:43）

- 范围：`frontend/novel-assistant-frontend/src/components/editor/AIAssistant.tsx`
- fallback 发送路径接入统一事件消费：新增 `applyLegacyStreamChunk`，支持解析 `data: ...` SSE 行与 JSON `message_chunk`，统一落入 `applyStreamEvent`。
- fallback 路径补齐 artifact 与工具事件链路能力：若服务端返回结构化事件，可与 proxy 路径一致生成 `tool_dispatch/tool_result/hitl_interrupt` 渲染。
- fallback 路径补齐会话级刷新与防串流：结束回调改为会话校验后 flush + 同步快照；停止回调统一清理 `activeStreamRunRef` 并 flush 会话刷新队列。

# 增量风险点

- 旧接口 `agentService.chatStream` 输出格式在不同后端实现下可能差异较大，当前逻辑已兼容纯文本与 SSE `data:` 两类主流形式。
- `AIAssistant.tsx` 的历史 lint 问题（`no-explicit-any` 等）仍未收敛，本次聚焦行为一致性。

# 增量验证结果

- `npx tsc --noEmit --pretty false | Select-String "AIAssistant.tsx"`：通过（改造文件无新增 TS 报错）。
- `npx eslint src/components/editor/AIAssistant.tsx`：失败，存在文件历史 lint 问题（`no-explicit-any`、`no-unused-vars`、hooks 依赖告警）。
- `npm run lint`：失败，存在仓库范围历史前端存量问题（非本次单点引入）。
- `npx tsc --noEmit`：失败，存在仓库范围历史类型问题（非本次单点引入）。

---

# 增量提交说明（2026-03-08 08:39）

- 范围：`frontend/novel-assistant-frontend/src/components/editor/AIAssistant.tsx`
- 新增会话级文档刷新调度器：`scheduleDocumentRefresh + flushScheduledDocumentRefresh`，对同会话多次 `tool_result` 做合并与节流触发。
- 文档刷新事件增加 `session_key` 透传，保障前端渲染层按会话隔离处理同步事件。
- `chat` 与 `review` 两条工具结果链路均改为调度器触发，结束流和结束审核时主动 flush，避免尾事件丢失。
- 切换会话、删除会话、手动停止流时新增 flush 逻辑，防止残留定时器在错误会话触发刷新。

# 增量风险点

- `AIAssistant.tsx` 仍有历史 `no-explicit-any` 与 hooks 依赖告警，未在本轮清理。
- 文档刷新节流窗口当前为 `200ms`，如后续工具并发模式变化需按实际交互再调参。

# 增量验证结果

- `npx tsc --noEmit --pretty false | Select-String "AIAssistant.tsx"`：通过（改造文件无新增 TS 报错）。
- `npx eslint src/components/editor/AIAssistant.tsx`：失败，存在文件历史 lint 问题（`no-explicit-any`、`no-unused-vars`、hooks 依赖告警）。
- `npm run lint`：失败，存在仓库范围历史前端存量问题（非本次单点引入）。
- `npx tsc --noEmit`：失败，存在仓库范围历史类型问题（非本次单点引入）。
