from dataclasses import dataclass
from pydantic import BaseModel,Field
from typing import List
from common.context import Context

# Agent全局状态
@dataclass
class PromptRecommendationAgentState():
    """State schema for the Prompt Recommendation Agent."""
    context: Context
    res:list[str]
# Agent输入
@dataclass
class Input():
    context: Context

# Agent输出
@dataclass
class Output():
    res:list[str]


"""
格式器
"""
# 推荐列表
class RecommendationListStructure(BaseModel):
    """输出数据结构"""
    suggestions: List[str] = Field(description="建议列表")
