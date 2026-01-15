from enum import Enum

class NovelState(str, Enum):
    """小说状态"""
    UPDATING = "UPDATING"  # 连载中
    COMPLETED = "COMPLETED"  # 已完结
    HIATUS = "HIATUS"  # 断更

class NodeType(str, Enum):
    """节点类型"""
    FOLDER = "FOLDER"
    DOCUMENT = "DOCUMENT"
