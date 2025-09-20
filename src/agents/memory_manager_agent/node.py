from common.prompts import (Long_Term_Memory_Context_To_System_Messages_Prompt,
                            Work_Memory_Context_To_System_Messages_Prompt,
                            Reflection_Extract_Prompt,
                            Semantic_Extract_Prompt,
                            Contextual_Extract_Prompt)
from common.memory import  (SemanticMemory,
                            ReflectionMemory,
                            ContextualMemory
                            )
from common.model_loader import memory_manager_agent_model
from langchain_core.messages import SystemMessage
from common.context import Context
from state import (
    Output,
    Input,
    MemoryBuilderAgentState,
)




llm=memory_manager_agent_model
#  历史记录-分发->事件分析节点-List[Event]:分发->归因节点->评估->归约节点->memory:反思
#  历史记录-分发->语义节点->moemory:语义
#  历史记录-分发->情景->memory:情景
#  构建记忆的智能体

# 历史记录归一化节点
def history_schema_normalization_node(state:Input):
#     """
#         归一化不同的数据类型的历史记录,并将其统一转换为`AnyMessage`类型的列表
#     """
    if isinstance(state.history,Context):
        # 将长期记忆作为顶级系统提示词
        long_term_memory=state.history.long_term_memory
        long_term_memory=SystemMessage(content=Long_Term_Memory_Context_To_System_Messages_Prompt.format(long_term_memory=long_term_memory))
        # 将工作记忆作为次级AI输出
        work_memory=state.history.work_memory
        work_memory=SystemMessage(content=Work_Memory_Context_To_System_Messages_Prompt.format(work_memory=work_memory))
        # 历史记录作为原始内容
        short_term_memory=state.history.short_term_memory
        # 合并成完整的历史记录--->去除KD
        history=[long_term_memory,work_memory,short_term_memory]
        state.normalizated_history = history
    elif isinstance(state.history,list):
        state.normalizated_history = state.history
    else:
        raise ValueError("history must be Context or List[AnyMessage]")
    return state 

# 提取反思内容
def reflection_build_node(state:MemoryBuilderAgentState):
    """
        反思记忆的构建节点:用于提取历史记录的信息并构建`反思`的节点
    """
    prompt=Reflection_Extract_Prompt.format(history=state.normalizated_history)
    response=llm.invoke(prompt)
    return {"reflection_memory":response}
# 提取语义
def semantic_build_node(state:MemoryBuilderAgentState):
    """
        语义记忆的构建节点:用于提取历史记录的信息并构建`语义`的节点
    """
    prompt=Semantic_Extract_Prompt.format(history=state.normalizated_history)
    response=llm.invoke(prompt)
    return {"semantic_memory":response}
# 提取场景
def contextual_build_node(state:MemoryBuilderAgentState):
    """
        情景记忆的构建节点:用于提取历史记录的信息并构建`情景`的节点
    """
    prompt=Contextual_Extract_Prompt.format(history=state.normalizated_history)
    response=llm.invoke(prompt)
    return {"contextual_memory":response}

def memmory_save_node(state:MemoryBuilderAgentState)->Output:
    """
        记忆保存节点:用于将提取到的记忆保存到状态中
    """
    reflection_memory=state.reflection_memory
    semantic_memory=state.semantic_memory
    contextual_memory=state.contextual_memory
    _reflection_memory=ReflectionMemory(content=reflection_memory.content) if reflection_memory else None
    _semantic_memory=SemanticMemory(content=semantic_memory.content) if semantic_memory else None
    _contextual_memory=ContextualMemory(content=contextual_memory.content) if contextual_memory else None

    return {"reflection_memory":reflection_memory,
            "semantic_memory":semantic_memory,
            "contextual_memory":contextual_memory}