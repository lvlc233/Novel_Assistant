from pydantic import BaseModel,Field
from typing import List
from langchain_core.messages import AnyMessage
from common.memory import BaseMemory



@dataclass_json
@dataclass
class Context():
    """
        上下文类,用于存储Agent的运行时上下文信息
        上下文信息包括:
            2,长期记忆:List[BaseMemory]
            3,工作记忆:List[BaseMemory]
            4,短期记忆:List[AnyMessage]
            5,检索的知识数据:str|KD
    """

    """长期记忆:
        长期记忆由工作记忆和短期记忆提炼出来,可由概率函数根据记忆的重要性以及时效性来做选择与二次提炼总结
        主要服务于用户的交互体验,可以自定义`关注`优先级,且永远保持在上下文的上头
    """
    # 被定义在SystemMessages中
    long_term_memory:List[BaseMemory] = field(default_factory=list)

    """工作记忆:
        存储结构化的会话级别的记忆,并不具备跨会话的特性,旨在将短期记忆中的核心提取出来
        好处:
            1,压缩上下文长度
            2,提高token的价值
            3,避免跨会话级别的记忆频繁的更新
    """
    # 被定义在AIMessages中
    work_memory:List[BaseMemory] = field(default_factory=list)

    """短期记忆:
        存储基础的Agent和用户对话,回答,工具调用的多轮对话
        多轮对话的轮次不会很长,单长过了一定长度后,就会自动的转化为工作记忆,完成转化后将移除短期记忆
        也包括KD的内容?
    """
    # 被定义在正常的列表里,
    # 暂时不考虑序列化-->直接拿
    short_term_memory: List[AnyMessage] = field(default_factory=list,metadata=config(exclude=lambda x: True))
 
    """检索的知识数据:
        这里采取索引+缓存的策略
        理由:
            索引:避免上下文膨胀
            缓存:提供检索的实际文档,并且考虑到跨会话需求,缓存建立在整个程序的启动到结束的生命周期里
    """
    # AIMessages中
    knowledge_data:str|None = None
    """
    元数据
    """
    metadata:dict = field(default_factory=dict)
    
    def _to_dict(self)->dict:
        """
        转换为上下文字典
        """ 
        return {
            "long_mem":  [m.to_context_dict() for m in self.long_term_memory],
            "work_mem":  [m.to_context_dict() for m in self.work_memory],
            "history":   self.short_term_memory,          # List[AnyMessage] 直接给 MessagesPlaceholder
            "knowledge_data": self.knowledge_data or "无",
        }
    def to_system_prompt_dict(self)->dict:
        """
        转换为上下文系统提示词
        返回:
            context_system:长期记忆,工作记忆,知识数据
        """
        return {"context_system":Context_to_System_Prompt.format(**self._to_dict())}
    def to_history_dict(self):
        """"
        转化为上下文历史记录
            history:上下文的历史记录,包含了用户的输入和Agent的输出
        """
        return {"history":self.short_term_memory}
