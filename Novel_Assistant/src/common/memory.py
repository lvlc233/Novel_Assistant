from dataclasses import dataclass, field
from enum import Enum
from dataclasses_json import dataclass_json
from typing import Optional
from datetime import datetime

class MemoryType(Enum):
    """
    记忆类型
        SemanticMemory: 语义记忆
        ReflectionMemory: 反思记忆
        ContextualMemory: 场景记忆
    具体解释看具体实现
    """
    SemanticMemory  = "Semantic memory is the store of facts, concepts, laws, and other similar content."

    ReflectionMemory = "Reflection memory consists of the operating rules governing the agent’s own actions."

    ContextualMemory = "Contextual memory is the record of what the agent and user have done together."
@dataclass_json
@dataclass
class BaseMemory:
    """Base class for memory implementations."""
    """记忆类型的基类"""
    """数据插入的时间"""
    memory_id:str|int = field(init=False)
    content: str
    type: MemoryType
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    metadata: Optional[dict] = field(default=None, kw_only=True)

    def __post_init__(self):
        self.memory_id = generate_id()
        if self.metadata is None:          # 兜底：None → 空 dict
            self.metadata = {}
    def to_context_dict(self):
        """
        转换为上下文字典
        """
        return {
            "memory_id": self.memory_id, 
            "content": self.content,
            "type": self.type._name_,
            "description": self.type.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

@dataclass_json
@dataclass
class SemanticMemory(BaseMemory):

    """语义记忆
        语义记忆:一下只是做解释,只是表示语义记忆就是这些内容的所指,并非说这些内容都需要实现
        表示:事实、概念、规律等内容的记忆(三元组,定义于类别,可验证的命题)
            事实: 可确认的已发生过的事情
                例如: 张三是李四的好友
            概念: 是人们对现象的一种抽象
                现象: 苹果落地
                抽象: 自由落体
            规律: 是概念之间的稳定关系
                太阳每天都会从东边升起西边落下
    """
    type: MemoryType = field(init=False)

    def __post_init__(self):
        super().__post_init__()
        self.type = MemoryType.SemanticMemory

@dataclass_json
@dataclass
class ReflectionMemory(BaseMemory):
    """反思记忆:
        关于Agent和用户交互的反思内容,用于指导后续Agent的行为准则
    """
    type: MemoryType = field(init=False)

    def __post_init__(self):
        super().__post_init__()
        self.type = MemoryType.ReflectionMemory

@dataclass_json
@dataclass
class ContextualMemory(BaseMemory):

    """场景记忆:
        关于用户的使用习惯,偏好,记录用户的使用场景,环境,时间等
    """
    type: MemoryType = field(init=False)

    def __post_init__(self):
        super().__post_init__()
        self.type = MemoryType.ContextualMemory


