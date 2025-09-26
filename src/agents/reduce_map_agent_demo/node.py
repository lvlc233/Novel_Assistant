from state import ReduceState,Input,ExtractInfoState,FeatureCard,Output
from typing import List
from langchain_core.messages import SystemMessage
from langgraph.types import Send
from common.prompts import Extract_Info_Prompt_Template,Reduce_Extract_Info_Prompt_Template

from common.model_loader import extract_info_agent_model


def map_docment_router(state: Input) -> List[Send]:
    """
    映射文档节点
    """
    
    documents = state.documents

    return [Send("extract_info_llm_node",{"document":document}) for document in documents ]


def extract_info_llm_node(state: ExtractInfoState) -> ReduceState:
    document = state.get("document")

    """
    提取信息节点
    """
    prompt =Extract_Info_Prompt_Template().invoke({"document":document})
    response = extract_info_agent_model.with_structured_output(FeatureCard).invoke(prompt)
    return {"sub_features":response.feature_and_value}

def reduce_node(state: ReduceState) -> Output:
    """
    合并节点
    """
    sub_features = state.sub_features
    prompt = Reduce_Extract_Info_Prompt_Template().invoke({"sub_features":sub_features})
    response = extract_info_agent_model.with_structured_output(FeatureCard).invoke(prompt)
    return {"features":response.feature_and_value}
