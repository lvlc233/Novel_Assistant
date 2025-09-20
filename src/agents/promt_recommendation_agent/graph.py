from langgraph.graph import StateGraph
from common.context import Context
from state import PromptRecommendationAgentState,Input,Output
from node import call_model_node


# 结构化输出器



# Define the graph
graph = (
    StateGraph(PromptRecommendationAgentState, input_schema=Input,output_schema=Output)
    .add_node("llm",call_model_node)
    .set_entry_point("llm")
    .set_finish_point("llm")
)

agent=graph.compile(name="Prompt Recommendation Agent")


