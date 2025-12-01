from enum import Enum
class NovelState(str, Enum):
    """小说状态."""
    UPDATING = "UPDATING"
    COMPLETED = "COMPLETED"
    DELETED = "DELETED"

class NodeTypeEnum(str, Enum):
    """节点类型."""
    NOVEL = "NOVEL"
    FOLDER = "FOLDER"
    CHAPTER = "CHAPTER"