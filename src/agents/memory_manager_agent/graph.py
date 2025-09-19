from __future__ import annotations

from typing import Literal
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph
from langgraph.types import Command,Send
from common.prompts import (
                            Work_Memory_Context_To_System_Messages_Prompt,
                            Long_Term_Memory_Context_To_System_Messages_Prompt,
                            Reflection_Extract_Prompt,
                            Semantic_Extract_Prompt,
                            Contextual_Extract_Prompt,
                            )
from common.memory import SemanticMemory,ReflectionMemory,ContextualMemory
from common.context import Context
from common.model_loader import memory_manager_agent_model
from state import (
    Output,
    Input,
    MemoryBuilderAgentState,
)
from dotenv import load_dotenv
import os

# 加载.env文件
load_dotenv(dotenv_path=".env",override=True)

# # # 确保 LangSmith 追踪启用--->只有这么做了才会开始追踪
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv('LANGSMITH_API_KEY')
os.environ["LANGCHAIN_PROJECT"] = os.getenv('LANGSMITH_PROJECT')



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
graph=StateGraph(MemoryBuilderAgentState)
graph.add_node("normalization",history_schema_normalization_node)
graph.add_node("reflection",reflection_build_node)
graph.add_node("semantic",semantic_build_node)
graph.add_node("contextual",contextual_build_node)
graph.add_node("memory_save",memmory_save_node)
graph.set_entry_point("normalization")
graph.add_edge("normalization","reflection")
graph.add_edge("normalization","semantic")
graph.add_edge("normalization","contextual")
graph.add_edge(["reflection","semantic","contextual"],"memory_save")
graph.set_finish_point("memory_save")
app=graph.compile(name="Memory Builder Agent")

from langchain.schema import HumanMessage, AIMessage

history = [
    HumanMessage(content="我想写一部末日短篇，主角是小机器人，要冷视角双线，往昔情感越浓越好，请给个大纲。"),
    AIMessage(content="收到！先给你一份双线结构：主线机器人冷记录，副线人类热回忆，用三件物品引出末日真相。你看行吗？"),

    HumanMessage(content="结局透太多，机器人铺垫也少，节奏太急，能不能再慢点？"),
    AIMessage(content="好，我补上机器人背景、系统倒计时和拾荒细节，再把回忆拆成多段，放慢节奏。"),

    HumanMessage(content="还是干，技术词满屏，完全不像小说，把系统提示全去掉行不？"),
    AIMessage(content="明白，我重写了一版：只留动作、触感、环境回声，让读者自己渗情感，你试读一下。"),

    HumanMessage(content="这样舒服多了，不过三章以后打算怎么推进？我怕后期乏力。"),
    AIMessage(content="后期让三条独立人类故事线切片交叉，机器人继续冷捡，最后留5%空白文件头，真相只给一半。"),

    HumanMessage(content="可以，但我想让三条线价值观冲突再狠一点，有建议吗？"),
    AIMessage(content="把三线核心冲突分别定为：爱情VS科技傲慢、母爱VS体制保密、真相VS资本流量，末日触点统一叫‘镜子计划’，不解释是谁。"),

    HumanMessage(content="冲突设定不错，能把第一章完整示范给我吗？我要感受实际语气。"),
    AIMessage(content="（交出去掉所有技术词、只留动作与环境的试读）这样节奏对吗？"),

    HumanMessage(content="示范OK，就按这个语气写下去，每章2000字左右，别再加系统提示。"),
    AIMessage(content="收到，后续章节保持同样语调，机器人零解读，读者自己拼碎片，我开工了。")
]
result=app.invoke({"history":history})
print(result)

    # if state.reflection_memory:
    #     state.reflection_memory.save()
    # if state.semantic_memory:
    #     state.semantic_memory.save()
    # if state.contextual_memory:
    #     state.contextual_memory.save()

# 写出来了,但是效果不太好,这里决定先用简单单LLM尝试
# # 经历提取节点
# def reflection_experience_build_node(state:MemoryBuilderAgentState)->MemoryBuilderAgentState:
#     """
#         反思记忆的经历节点:用于提取历史记录的信息并构建`经历`的节点
#     """
#     experience_llm=llm.with_structured_output(ReflectionExperienceSchema)
#     prompt=Reflection_Prompt_With_Experience.format(history=state.normalizated_history) 
#     experience=experience_llm.invoke(prompt)
#     return {"reflection_experience":experience.experience}
# # 经历归因生成节点
# def reflection_reason_build_node(state:HistoryAndExperienceState)->Send[Literal["action"]]:
#     """
#         反思记忆的归因生成节点:
#     """

#     # 对单个经历进行归因
#     # history=state.history
#     # id=state.id
#     # experience=state.experience
#     history=state.get("history")
#     id=state.get("id")
#     experience=state.get("experience")
#     prompt=Reflection_Prompt_With_Reason.format(history=history,experience=id+":"+experience)
#     reason=llm.invoke(prompt)
#     return Send("action",
#             {"reflection_reason":{id:reason},
#             "history":history,
#             "experience":{id:experience},
#             "reason":{id:reason},
#             }
#     )
# # 反思记忆的行为生成节点:
# def reflection_action_build_node(state:HistoryAndExperienceAndReasonState)->MemoryBuilderAgentState:
#     """
#         反思记忆的行为生成节点:
#     """
#     history=state.get("history")
#     experience=state.get("experience")
#     reason=state.get("reason") 
#     prompt=Reflection_Prompt_With_Action.format(history=history,experience=experience,reason=reason)
#     action=llm.invoke(prompt)
#     return {"reflection_action":{id:action}}
# # 反思记忆生成节点
# def reflection_reduce_node(state:MemoryBuilderAgentState)->MemoryBuilderAgentState:
#     """
#         反思记忆的归约节点: 将反思的结果合并为反思记忆
#     """
#     history=state.normalizated_history
#     experience=state.reflection_experience
#     reason=state.reflection_reason
#     action=state.reflection_action
#     prompt=Reflection_Prompt_With_Reduce.format(history=history,experience=experience,reason=reason,action=action)
#     reflection_memory=llm.invoke(prompt)
#     return {"reflection_memory":reflection_memory}




# reflection_graph=StateGraph(MemoryBuilderAgentState)
# reflection_graph.add_node("experience",reflection_experience_build_node)
# reflection_graph.add_node("reason",reflection_reason_build_node)
# reflection_graph.add_node("action",reflection_action_build_node)
# reflection_graph.add_node("reduce",reflection_reduce_node)
# reflection_graph.set_entry_point("experience")
# reflection_graph.add_conditional_edges("experience",
#     (lambda state: [Send("reason",{"history":state.normalizated_history,"id":id,"experience":experience}) for id,experience in state.reflection_experience.items()]),
#     {"reason":"reason"}
# )
# reflection_graph.add_edge("action","reduce")
# reflection_node=reflection_graph.compile(name="Reflection Memory Builder Node")

# from langchain_core.messages import HumanMessage, AIMessage


# # 现在 history 就是包含 10 条消息的列表
# result=reflection_node.invoke({"history":history_novel,"normalizated_history":history_novel})
# print(result)



# graph=StateGraph(MemoryBuilderAgentState,input_schema=Input,output_schema=Output)
# graph.add_node(history_schema_normalization_node)

