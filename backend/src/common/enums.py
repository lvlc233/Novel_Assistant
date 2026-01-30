from enum import Enum


class WorkTypeEnum(str, Enum):
    """作品类型."""
    NOVEL = "novel"  # 小说

class WorkStateEnum(str, Enum):
    """作品状态(DB)."""
    UPDATING = "updating"  # 连载中
    COMPLETED = "completed"  # 已完结
    HIATUS = "hiatus"  # 断更

class WorkStateCNEnum(str, Enum):
    """作品状态(前端显示)."""
    UPDATING = "进行中"
    COMPLETED = "完成"

class NodeTypeEnum(str, Enum):
    """节点类型."""
    FOLDER = "folder"
    DOCUMENT = "document"

class PluginFromTypeEnum(str, Enum):
    """插件来源类型."""
    SYSTEM = "system"
    CUSTOM = "custom"

class PluginScopeTypeEnum(str, Enum):
    """插件作用域类型."""
    GLOBAL = "global"
    WORK = "work"
    DOCUMENT = "document"

class MemoryTypeEnum(str, Enum):
    """记忆类型."""
    LONG_TERM = "long_term"  # 长期记忆
    SHORT_TERM = "short_term"  # 短期记忆

