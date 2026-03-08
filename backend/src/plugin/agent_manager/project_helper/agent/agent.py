from typing import Any

from langchain_core.messages import AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.runtime import Runtime
from langgraph.graph import StateGraph
from plugin.agent_manager.project_helper.agent.schema import ProjectHelperAgentRuntime, ProjectHelperAgentState

"""
项目节点
"""
async def call_llm(
    state: ProjectHelperAgentState,
    runtime: Runtime[ProjectHelperAgentRuntime],
) -> dict[str, Any]:
    """
    项目助手智能体
    """
    context = runtime.context
    llm = ChatOpenAI(
        model=context["model_name"],
        api_key=context["api_key"],
        base_url=context["base_url"],
    )
    messages = list(state.get("messages", []))
    response = await llm.ainvoke([SystemMessage(content="你是项目助手。"), *messages])
    if not isinstance(response, AIMessage):
        response = AIMessage(content=str(getattr(response, "content", response)))
    return {"messages": [response], "context": state.get("context", "")}


# graph
graph = StateGraph(ProjectHelperAgentState, context_schema=ProjectHelperAgentRuntime)
graph.add_node(call_llm).set_entry_point("call_llm").set_finish_point("call_llm")

