import json
from datetime import datetime
from typing import Any, Literal, cast

from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.runtime import Runtime

from plugin.agent_manager.document_helper.agent.schema import DocumentHelpAgentRuntime, DocumentHelpAgentState
from plugin.agent_manager.document_helper.agent.tools import build_document_helper_tools

SENSITIVE_TOOLS = set()
ALLOWED_DECISIONS = {"approve", "edit", "reject"}


def _now_text() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _safe_json(data: Any) -> str:
    try:
        return json.dumps(data, ensure_ascii=False)
    except Exception:
        return str(data)


def _extract_tool_calls(message: AIMessage) -> list[dict[str, Any]]:
    tool_calls = cast(list[dict[str, Any]], getattr(message, "tool_calls", []) or [])
    return [call for call in tool_calls if isinstance(call, dict) and call.get("name")]


def _resolve_runtime_context(
    runtime: Runtime[DocumentHelpAgentRuntime],
    fallback_context: DocumentHelpAgentRuntime | None,
) -> DocumentHelpAgentRuntime:
    runtime_context = getattr(runtime, "context", None)
    if isinstance(runtime_context, dict) and runtime_context:
        return cast(DocumentHelpAgentRuntime, runtime_context)
    if isinstance(fallback_context, dict):
        return fallback_context
    return cast(DocumentHelpAgentRuntime, {})


async def call_model(
    state: DocumentHelpAgentState,
    runtime: Runtime[DocumentHelpAgentRuntime],
    fallback_context: DocumentHelpAgentRuntime | None = None,
) -> dict[str, Any]:
    context = _resolve_runtime_context(runtime, fallback_context)
    model_name = context.get("model_name")
    api_key = context.get("api_key")
    base_url = context.get("base_url")
    session = context.get("session")
    if not model_name or not api_key or not base_url or session is None:
        raise ValueError("document helper runtime context is incomplete")
    model = ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        timeout=20.0,
        max_retries=0,
    )
    builtin_tools = build_document_helper_tools(
        document_content=context.get("document_content", ""),
        session=session,
        document_title=context.get("document_title"),
        default_work_id=context.get("work_id"),
        default_document_id=context.get("document_id"),
        default_version_id=context.get("version_id"),
    )
    runtime_tools = list(context.get("tools", []))
    all_tools = [*builtin_tools, *runtime_tools]
    system_prompt = context.get("user_prompt") or "你是文档助手，优先使用工具读取或修改文档。"
    model_with_tools = model.bind_tools(all_tools)
    current_messages = list(state.get("messages", []))
    invoke_messages = [SystemMessage(content=system_prompt), *current_messages]
    response = await model_with_tools.ainvoke(invoke_messages)
    if not isinstance(response, AIMessage):
        response = AIMessage(content=str(getattr(response, "content", response)))
    tool_calls = _extract_tool_calls(response)
    next_context = f"{state.get('context', '')}\n[{_now_text()}] model_invoked"
    return {
        "messages": [response],
        "pending_tool_calls": tool_calls,
        "step_count": int(state.get("step_count", 0)) + 1,
        "context": next_context,
    }


def route_after_model(state: DocumentHelpAgentState) -> Literal["tool_gate", "end"]:
    if int(state.get("step_count", 0)) >= 12:
        return "end"
    if state.get("pending_tool_calls"):
        return "tool_gate"
    return "end"


async def tool_gate(
    state: DocumentHelpAgentState,
    runtime: Runtime[DocumentHelpAgentRuntime],
    fallback_context: DocumentHelpAgentRuntime | None = None,
) -> dict[str, Any]:
    pending_calls = list(state.get("pending_tool_calls", []))
    if not pending_calls:
        return {"current_tool_call": None}
    current_call = pending_calls[0]
    tool_name = str(current_call.get("name", ""))
    tool_args = current_call.get("args", {}) or {}
    tool_call_id = str(current_call.get("id", ""))
    effective_name = tool_name
    effective_args = tool_args
    if tool_name in SENSITIVE_TOOLS:
        # HITL removed
        pass
    context = _resolve_runtime_context(runtime, fallback_context)
    session = context.get("session")
    if session is None:
        raise ValueError("document helper runtime session is missing")
    builtin_tools = build_document_helper_tools(
        document_content=context.get("document_content", ""),
        session=session,
        document_title=context.get("document_title"),
        default_work_id=context.get("work_id"),
        default_document_id=context.get("document_id"),
        default_version_id=context.get("version_id"),
    )
    runtime_tools = list(context.get("tools", []))
    all_tools = [*builtin_tools, *runtime_tools]
    tool_map = {tool.name: tool for tool in all_tools}
    target_tool = tool_map.get(effective_name)
    if target_tool is None:
        tool_result: Any = {"status": "error", "message": f"未找到工具: {effective_name}"}
    else:
        try:
            tool_result = await target_tool.ainvoke(effective_args)
        except Exception as exc:
            tool_result = {
                "status": "error",
                "message": f"{type(exc).__name__}: {str(exc)}",
                "tool_name": effective_name,
            }
    tool_message = ToolMessage(
        content=_safe_json(tool_result),
        tool_call_id=tool_call_id,
        name=effective_name,
    )
    return {
        "messages": [tool_message],
        "pending_tool_calls": pending_calls[1:],
        "current_tool_call": None,
        "context": f"{state.get('context', '')}\n[{_now_text()}] tool_done:{effective_name}",
    }


def route_after_tool(state: DocumentHelpAgentState) -> Literal["tool_gate", "call_model"]:
    if state.get("pending_tool_calls"):
        return "tool_gate"
    return "call_model"


async def build_agent(
    runtime_context: DocumentHelpAgentRuntime,
    checkpointer
):
    graph = StateGraph(DocumentHelpAgentState, context_schema=DocumentHelpAgentRuntime)
    async def _call_model(state: DocumentHelpAgentState, runtime: Runtime[DocumentHelpAgentRuntime]):
        return await call_model(state, runtime, runtime_context)

    async def _tool_gate(state: DocumentHelpAgentState, runtime: Runtime[DocumentHelpAgentRuntime]):
        return await tool_gate(state, runtime, runtime_context)

    graph.add_node("call_model", _call_model)
    graph.add_node("tool_gate", _tool_gate)
    graph.add_edge(START, "call_model")
    graph.add_conditional_edges("call_model", route_after_model, {"tool_gate": "tool_gate", "end": END})
    graph.add_conditional_edges("tool_gate", route_after_tool, {"tool_gate": "tool_gate", "call_model": "call_model"})
    
    return graph.compile(checkpointer=checkpointer)
