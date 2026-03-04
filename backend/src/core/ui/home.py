
# 示例：前端系统定义的结构（通常放在一个 shared_ui.py 中）
from core.ui.base import Component, Page, Slot




"""
26.03.02: 这个设计其实有个问题之前没有考虑到,就是对于复用的组件呢?如果这样子写,虽然高可控,但是复用率低了旧,
一个设计为什么会有问题,为什么我当时没有想到呢?...
一个设计的问题我不再总是尝试解决,而是作为一个思考点悬置。然后继续做下去
"""
class Home(Page):
    class PluginExpand(Slot):
        class PluginCard(Component):
            def __init__(self, name: str): pass


    class ProjectChatInput(Component):
        def __init__(self, project_id: str): pass
        
    class EmailBoot(Component):
        def __init__(self): pass
        
    class EmailBox(Slot):
        class AgentBox(Component):
            def __init__(self, agent_name: str): pass

    class Bottom(Slot):
        class QuickInput(Component):
            def __init__(self): pass

    class Main(Slot):
        pass

            
            
    # class PluginDetails(Slot):
    #     class Info(Component):
    #         def __init__(self, content: str, status: str, node_id: str): pass