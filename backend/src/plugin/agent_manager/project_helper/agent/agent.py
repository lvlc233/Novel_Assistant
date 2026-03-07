
from langgraph.runtime import Runtime
from langgraph.graph import StateGraph
from plugin.agent_manager.project_helper.agent.schema import ProjectHelperAgentRuntime, ProjectHelperAgentState

"""
项目节点
"""
async def call_llm(state: ProjectHelperAgentState, runtime: Runtime[ProjectHelperAgentRuntime]) -> ProjectHelperAgentState:
    """
    项目助手智能体
    """
    context = runtime.context
    model_name = context.get("model_name")
    base_url = context.get("base_url")
    api_key = context.get("api_key")
    
    # 显式指定 model_provider="openai" 以支持 OpenAI 兼容的 API (如 SiliconFlow)
    # 尝试直接使用 ChatOpenAI 以确保 base_url 正确传递
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
    )
    
    response = await llm.ainvoke(state["query"])
    return {"response": response.content}


# graph
graph = StateGraph(ProjectHelperAgentState, context_schema=ProjectHelperAgentRuntime)
graph.add_node(call_llm).set_entry_point("call_llm").set_finish_point("call_llm")


