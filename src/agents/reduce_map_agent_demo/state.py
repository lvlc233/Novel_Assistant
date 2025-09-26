
from dataclasses import dataclass, field
from pydantic import BaseModel,Field
from langchain_core.documents import Document
from typing import Annotated, List,Dict
def list_reduce(left:Dict[str,Dict[str,str]],right:Dict[str,Dict[str,str]])->Dict[str,Dict[str,str]]:   
    """
        合并两个列表,
    """
    return {**left,**right}




# Agent全局状态
@dataclass
class MapReduceAgentState:
    """
    状态定义
    """
    documents: List[Document]
    features: Dict[str,Dict[str,str]]=field(default_factory=dict)
@dataclass
class ExtractInfoState:
    """
    提取信息类
    """
    document: Document
    sub_features: Annotated[Dict[str,Dict[str,str]],list_reduce]
@dataclass
class ReduceState:
    """
    合并的状态
    """
    sub_features: Annotated[Dict[str,Dict[str,str]],list_reduce]
    features: Dict[str,Dict[str,str]]=field(default_factory=dict)
@dataclass  
class Input:
    """
    输入类
    """
    documents: List[Document]

@dataclass
class Output:
    """
    输出类
    """
    features: Dict[str,Dict[str,str]]


"""
格式器
"""
class FeatureCard(BaseModel):
    """
    特征类
    """
    feature_and_value: Dict[str,Dict[str,str]] = Field(description="外层key是随机字符串,内层key是特征,value是特征值")
 





