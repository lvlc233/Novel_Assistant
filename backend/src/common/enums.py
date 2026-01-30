from enum import Enum


class NovelState(str, Enum):
    """小说状态(DB)."""
    UPDATING = "updating"  # 连载中
    COMPLETED = "completed"  # 已完结
    HIATUS = "hiatus"  # 断更

class NovelStateCN(str, Enum):
    """小说状态(前端显示)."""
    UPDATING = "进行中"
    COMPLETED = "完成"

class NodeType(str, Enum):
    """节点类型."""
    FOLDER = "folder"
    DOCUMENT = "document"

class PluginFromType(str, Enum):
    """插件来源类型."""
    SYSTEM = "system"
    CUSTOM = "custom"

class PluginScopeType(str, Enum):
    """插件作用域类型."""
    GLOBAL = "global"
    WORK = "work"
    DOCUMENT = "document"
