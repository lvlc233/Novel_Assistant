
from psycopg.pq import PGconn
from plugin.project_helper.agent.schema import ProjectHelperAgentRuntime, ProjectHelperAgentState
from langgraph.runtime import Runtime
from langchain.chat_models import BaseChatModel, init_chat_model
from langgraph.graph import StateGraph,START,END
from langgraph.checkpoint.postgres import Connection, PostgresSaver
from common.model.base_agent import build_agent

"""
项目节点
"""
async def call_llm(state: ProjectHelperAgentState, runtime: Runtime[ProjectHelperAgentRuntime]) -> ProjectHelperAgentState:
    """
    项目助手智能体
    """
    runtime_context = runtime.context
    llm :BaseChatModel= init_chat_model(runtime_context.model_name, runtime_context.base_url, runtime_context.api_key)
    response = await llm.ainvoke(state.query)
    return {"response":response}


# graph
graph = StateGraph(ProjectHelperAgentState)
graph.add_node(call_llm).set_entry_point("call_llm").set_finish_point("call_llm")



