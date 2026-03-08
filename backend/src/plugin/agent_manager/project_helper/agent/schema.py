from typing import Annotated, List, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from pydantic import BaseModel

from common.model.base_agent import BaseAgentRuntime

"""
Agent: 模型
"""
class ProjectHelperAgentRuntime(BaseAgentRuntime):
    """
    项目助手智能体运行时数据模型
    """
    pass
    # page_id: str  # 项目ID


class ProjectHelperAgentState(TypedDict):
    """
    项目助手智能体状态模型
    """
    messages: Annotated[List[BaseMessage], add_messages]
    context: str
    page_id: str

"""
操作相关接口返回
"""
class ProjectHelperChatConfigResponse(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

class ProjectHelperChatConfigRequest(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

class ProjectHelperResourcesResponse(BaseModel):
    resource_name: list[str] # 资源名称列表
    enabled: bool # 是否启用

class ProjectHelperResourcesRequest(BaseModel):
    resource_name: list[str] # 资源名称列表
    enabled: bool # 是否启用
