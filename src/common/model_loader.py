# 模型加载器
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
import os
load_dotenv()
model_name = os.getenv("Prompt_Recommendation_Agent_LLM_Model_Name")
# 提示词推荐AgentLLM模型加载
# 定义schema


class OutputStructure(BaseModel):
    """输出数据结构"""
    suggestions: List[str] = Field(description="建议列表")

# 提示词推荐LLM模型加载
prompt_recommendation_agent_model = ChatOpenAI(
    model_name=model_name).with_structured_output(OutputStructure)

#记忆管理LLM模型加载
memory_manager_agent_model = ChatOpenAI(
    model_name=model_name)