
# from psycopg.pq import PGconn
from plugin.agent_manager.document_helper.agent.schema import DocumentHelpAgentRuntime, DocumentHelpAgentState
# from langgraph.runtime import Runtime
from langchain.chat_models import BaseChatModel, init_chat_model
# from langgraph.graph import StateGraph,START,END
# from langgraph.checkpoint.postgres import Connection, PostgresSaver
# from common.model.base_agent import build_agent

from langchain.agents import create_agent

"""
文档助手节点
"""
# async def call_llm(state: DocumentHelpAgentState, runtime: Runtime[DocumentHelpAgentRuntime]) -> DocumentHelpAgentState:
#     """
#     文档助手智能体
#     """
#     runtime_context = runtime.context
#     llm :BaseChatModel= init_chat_model(runtime_context.model_name, runtime_context.base_url, runtime_context.api_key)
#     response = await llm.ainvoke(state.query)
#     return {"response":response}


# # graph
# graph = StateGraph(DocumentHelpAgentState)
# graph.add_node(call_llm).set_entry_point("call_llm").set_finish_point("call_llm")

async def build_agent(runtime_context: DocumentHelpAgentRuntime):
    """
    构建文档助手智能体
    """
    llm :BaseChatModel= init_chat_model(runtime_context.model_name, runtime_context.base_url, runtime_context.api_key)
    agent = create_agent(
        llm=llm,
        tools=runtime_context.tools,
        verbose=True
    )
    return agent


agent = create_agent(

)



