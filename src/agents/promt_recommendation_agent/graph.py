

from __future__ import annotations

from dataclasses import dataclass
from langchain_core.messages import SystemMessage
from typing import Any, Dict, TypedDict
from langgraph.graph import StateGraph
from common.prompts import Prompt_Recommendation_Agent_System_Prompt
from common.context import Context
from common.memory import BaseMemory,ActionMemory,ContextualMemory
from common.model_loader import prompt_recommendation_agent_model




class PromptRecommendationAgentState(TypedDict):
    """State schema for the Prompt Recommendation Agent."""
    context: Context
    res:list[str]
class Input(TypedDict):
    context: Context
class Output(TypedDict):
    res:list[str]

# 结构化输出器

def call_model(state: PromptRecommendationAgentState) -> Dict[str, Any]:
    """Call the model with the given state."""
    context = state["context"]
    #  暂时用暴力的上下文全输出吧
    messages = [SystemMessage(content=Prompt_Recommendation_Agent_System_Prompt.format(context=context))]
    response = prompt_recommendation_agent_model.invoke(messages)
    return {"res":response.suggestions}


# Define the graph
graph = (
    StateGraph(PromptRecommendationAgentState, input_schema=Input,output_schema=Output)
    .add_node(call_model)
    .add_edge("__start__", "call_model")
    .compile(name="Prompt Recommendation Agent")    
)


c1=ContextualMemory(
    """
        你记得,曾经:
        用户很喜欢这个和你聊人物设定事情
    """
)
a2=ActionMemory (
    """
        你记得,曾经:
            你直接写入文本的时候,被用户阻止了,用户似乎不喜欢你没经过同意操作文档
    """
)
context = Context(long_term_memory=[c1,a2],work_memory=[],short_term_memory=[])
res=graph.invoke({"context": context})
print(res)

