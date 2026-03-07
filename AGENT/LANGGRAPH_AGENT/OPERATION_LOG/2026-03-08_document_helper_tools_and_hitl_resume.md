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

# 风险点

- 当前 HITL 的 `checkpointer` 使用进程内 `InMemorySaver`，服务重启后中断上下文会丢失。
- `manage_outline` 的 `payload` 目前以 JSON 字符串为输入约定，模型生成不稳定时可能触发解析失败。
- 前端 lint 仍存在大量历史存量问题，未在本次提交内清理。

# 验证结果

- `python -m py_compile` 校验通过：
  - `document_helper/agent/schema.py`
  - `document_helper/agent/tools.py`
  - `document_helper/agent/agent.py`
  - `document_helper/plugin.py`
  - `agent_manager/plugin.py`
- `npm run lint` 已执行，存在仓库历史问题，与本次改动功能链路无直接阻塞关系。
- `npm run typecheck` 脚本不存在（前端当前未提供该脚本）。
