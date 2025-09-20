from langgraph.graph import StateGraph
from node import (
    history_schema_normalization_node,
    reflection_build_node,
    semantic_build_node,
    contextual_build_node,
    memmory_save_node,
)
from state import (
    MemoryBuilderAgentState,
)




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
agent=graph.compile(name="Memory Builder Agent")


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

