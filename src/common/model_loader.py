# 模型加载器
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
import os
load_dotenv()
prompt_recommendation_agent_model_name = os.getenv("Prompt_Recommendation_Agent_LLM_Model_Name")
memory_manager_agent_model_name = os.getenv("Memory_Manager_Agent_LLM_Model_Name")
facade_agent_model_name = os.getenv("Facade_Agent_LLM_Model_Name")
extract_info_agent_model_name = os.getenv("Extract_Info_Agent_LLM_Model_Name")

# 提示词推荐LLM模型加载
prompt_recommendation_agent_model = ChatOpenAI(
    model_name=prompt_recommendation_agent_model_name)

#记忆管理LLM模型加载
memory_manager_agent_model = ChatOpenAI(
    model_name=memory_manager_agent_model_name)

#门面AgentLLM模型加载
facade_agent_model = ChatOpenAI(
    model_name=facade_agent_model_name)

# 提取信息LLM模型加载
extract_info_agent_model = ChatOpenAI(
    model_name=extract_info_agent_model_name)
