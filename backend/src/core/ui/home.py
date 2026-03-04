
# 示例：前端系统定义的结构（通常放在一个 shared_ui.py 中）
from typing import TypedDict, List

from core.ui.base import Component, Page, Slot




"""
26.03.02: 这个设计其实有个问题之前没有考虑到,就是对于复用的组件呢?如果这样子写,虽然高可控,但是复用率低了旧,
一个设计为什么会有问题,为什么我当时没有想到呢?...
一个设计的问题我不再总是尝试解决,而是作为一个思考点悬置。然后继续做下去
"""

# Agent消息单元,前端中,一个Agent对应一组的session,每个session是单独的卡片,messages有消息,这里的数据是为了冗余
class AgentMessageHistoryItem(TypedDict):
    agent_name: str
    session_id:str
    messages: list[dict]

# 邮箱配置,定义Agent是否开启邮件发送功能
class Email(TypedDict):
    agent_name:str
    on_email:bool
    history: List[AgentMessageHistoryItem]

# Project Session Structures
class ProjectSessionItem(TypedDict):
    id: str
    title: str
    create_time: str
    message_count: int
    tokens: int
    messages: List[dict]

class ProjectPageItem(TypedDict):
    id: str
    name: str
    sessions: List[ProjectSessionItem]

class ProjectSessionData(TypedDict):
    pages: List[ProjectPageItem]

# Document Session Structures
class DocumentSessionItem(TypedDict):
    id: str
    title: str
    create_time: str
    message_count: int
    tokens: int
    messages: List[dict]

class DocumentItem(TypedDict):
    id: str
    title: str
    sessions: List[DocumentSessionItem]

class DocumentSessionData(TypedDict):
    documents: List[DocumentItem]
    
registed={
    "AgentMessages":List[AgentMessageHistoryItem],
    "Email":Email,
    "ProjectSessionManager": ProjectSessionData,
    "DocumentSessionManager": DocumentSessionData
}

class Home(Page):
    class Main(Slot):
        pass
    # 仪表盘的第三个卡片
    class PluginExpand(Slot):
        # 中的插件的卡片信息
        class PluginCard(Component):
            def __init__(self, name: str): pass
    # 插件详情卡片
    class PluginDetails(Slot):
        class Info(Component):
            def __init__(self,name:str ,data: dict, info_type:str,info_register: dict=registed): pass # 这里期待的效果实际是后端可以根据type选择不同的泛型,但是现在需要多谢一个rregister不合理
    # 主页底部的输入框(仅用于项目助手Agent使用)
    class ProjectChatInput(Component):
        def __init__(self, project_id: str): pass
    
    # 邮件悬浮球
    class EmailBoot(Component):
        def __init__(self): pass
    
    # 邮箱
    class EmailBox(Slot):
        # Agent块
        class AgentBox(Component):
            def __init__(self, agent_name: str, on_email: bool, history: List[AgentMessageHistoryItem]): pass
    



            
        