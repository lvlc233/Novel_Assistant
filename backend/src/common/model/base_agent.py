
from typing import TypedDict

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import StateGraph
from langgraph.graph.state import CompiledStateGraph

class BaseAgentRuntime(TypedDict):
    """
    基础智能体运行时数据模型
    """

    model_name: str  # 模型名称
    base_url: str  # 基础URL
    api_key: str  # API密钥


class BaseToolFromPlugin():
    """
    从插件中加载工具
    """
    pass

async def build_agent(graph:StateGraph,checkpoint:BaseCheckpointSaver) -> CompiledStateGraph:
    """
    构建运行时智能体
    """
    return graph.compile(checkpointer=checkpoint)