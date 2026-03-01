
# 示例：前端系统定义的结构（通常放在一个 shared_ui.py 中）
from core.ui.base import Component, Page, Slot


class Home(Page):
    class Card(Slot):
        class Item(Component):
            def __init__(self, name: str, node_id: str): pass

    class CardDetails(Slot):
        class Info(Component):
            def __init__(self, content: str, status: str, node_id: str): pass