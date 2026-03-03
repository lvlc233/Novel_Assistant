from enum import Enum


class WorkTypeEnum(str, Enum):
    """作品类型."""
    NOVEL = "novel"  # 小说

class WorkStateEnum(str, Enum):
    """作品状态(DB)."""
    UPDATING = "updating"  # 连载中
    COMPLETED = "completed"  # 已完结

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
    OFFICIAL = "official"

class MemoryTypeEnum(str, Enum):
    """记忆类型."""
    LONG_TERM = "long_term"  # 长期记忆
    SHORT_TERM = "short_term"  # 短期记忆

"""
2026.03.01:新增加
--- 参数来源常量 ---
"""
class UIParamSourceEnum(str, Enum):
    CONTEXT = "context"  # 来自前端环境（URL, Session, Global State）
    PROPS = "props"      # 来自触发组件自身的属性
    INPUT = "input"      # 来自用户实时输入（默认）

class UITrigger(str, Enum):
    CLICK = "click"  #点击 
    MOUNT = "mount"  #挂载
    ENTER = "enter"  #发送  

class LoaderType(str, Enum):
    """插件数据源类型."""
    URL = "url"
    JSON = "json"
    INTERNAL = "internal"
