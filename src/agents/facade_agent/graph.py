
from __future__ import annotations

import sys
from pathlib import Path

# 添加src目录到Python路径
src_path = Path(__file__).parent.parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from dataclasses import dataclass
from langchain.schema import HumanMessage
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph
from langgraph.runtime import Runtime
from langchain_openai import ChatOpenAI
from common.context import Context
from common.prompts import Prompt_Recommendation_Agent_System_Prompt
from common.memory import BaseMemory,MemoryType
from dotenv import load_dotenv
load_dotenv()
import os
print(os.getenv("OPENAI_API_KEY"))
llm = ChatOpenAI(model_name="Qwen/Qwen3-Coder-30B-A3B-Instruct")



res = llm.invoke([SystemMessage(content=Prompt_Recommendation_Agent_System_Prompt)])
print(res.content)
