from langchain_core.messages import BaseMessage
from langchain_core.tools import BaseTool
from langgraph.graph import add_messages
from common.model.base_agent import BaseAgentRuntime
from common.utils.utils import create_uuid
from typing import Annotated, List, TypedDict

class DocumentHelpAgentRuntime(BaseAgentRuntime):
    """文档助手智能体运行时配置"""
    session_id: str = create_uuid()
    tools: List[BaseTool] = []
    """会话ID"""
    
class DocumentHelpAgentState(TypedDict):
    """文档助手智能体状态"""
    query: str = ""
    # 用户输入
    messages: Annotated[List[BaseMessage],add_messages]
    # 会话消息列表


