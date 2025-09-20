from state import PromptRecommendationAgentState
from typing import Dict, Any
from langchain_core.messages import SystemMessage
from common.prompts import Prompt_Recommendation_Agent_System_Prompt
from common.model_loader import prompt_recommendation_agent_model
from state import RecommendationListStructure



def call_model_node(state: PromptRecommendationAgentState) -> Dict[str, Any]:
    """Call the model with the given state."""
    context = state.context
    #  暂时用暴力的上下文全输出吧
    messages = [SystemMessage(content=Prompt_Recommendation_Agent_System_Prompt.format(context=context))]
    response = prompt_recommendation_agent_model.with_structured_output(RecommendationListStructure).invoke(messages)
    return {"res":response.suggestions}
