from dataclasses import dataclass,field
from pydantic import BaseModel,Field
from langchain_core.messages import AnyMessage
from typing import  Dict, Optional, TypedDict,List,Annotated
from common.context import Context
from common.memory import ReflectionMemory,ContextualMemory, SemanticMemory

def dict_reduce(left:Dict[str,str],right:Dict[str,str])->Dict[str,str]:
    """
        合并两个字典,如果有重复的key,则以right为准
    """
    return {**left,**right}

@dataclass
class MemoryBuilderAgentState:

    """
        State schema for the Prompt Recommendation Agent.
        history: 历史记录,可以是上下文对象或者消息列表->对应工作(List[AnyMessage])记忆生成和长期(Context)记忆生成。
        reflection_memory: 反思记忆,用于存储最终的反思结果,
        reflection_experience: 反思过程第一步的`经历`
        reflection_reason: 反思过程第二步的`原因`
        reflection_action: 反思过程第三步的`打算`
        semantic_memory: 语义记忆,用于存储提取到的语义结果,
        contextual_memory: 情景记忆,用于存储提取的情景结果,
        res: 构建记忆的结果,列表形式,每个元素是一个字符串
    """
    history: Context|List[AnyMessage]
    normalizated_history:List[AnyMessage] = field(default_factory=list)
    reflection_memory:Optional[ReflectionMemory] = None
    reflection_experience:Dict[str,str] = field(default_factory=dict)
    reflection_reason:Annotated[Dict[str,str],dict_reduce] = field(default_factory=dict)
    reflection_action:Annotated[Dict[str,str],dict_reduce] = field(default_factory=dict)
    semantic_memory:Optional[SemanticMemory] = None
    contextual_memory:Optional[ContextualMemory] = None
@dataclass
class HistoryAndExperienceState:
    """
        历史-单经历状态:用于归因节点
    """
    history: List[AnyMessage]
    experience:Annotated[Dict[str,str],dict_reduce]
@dataclass
class HistoryAndExperienceAndReasonState(HistoryAndExperienceState):
    """
        历史-单经历-单原因状态:用于分析节点
    """
    reason:Annotated[Dict[str,str],dict_reduce]

@dataclass
class Input:
    history: Context|List[AnyMessage]
@dataclass
class Output:
    reflection_memory:Optional[ReflectionMemory] = None
    semantic_memory:Optional[SemanticMemory] = None
    contextual_memory:Optional[ContextualMemory] = None


"""
格式器
"""
class ReflectionExperienceSchema(BaseModel):
    """
        反思-经历的数据结构
    """
    experience:Dict[str,str]=Field(description="key为递增整数从0开始,value是反思经历的具体内容,一个kv表示单个经历,一次交流可能有多个经历")