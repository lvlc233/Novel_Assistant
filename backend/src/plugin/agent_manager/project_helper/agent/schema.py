from common.model.base_agent import BaseAgentRuntime
# from 
from typing import TypedDict


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
    # messages: list  # 消息列表
    page_id: str  # 项目ID
    query: str  # 用户输入对话
    response: str  # AI响应回复


