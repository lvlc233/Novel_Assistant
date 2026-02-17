from typing import Any, Dict, List, cast

from langchain_core.messages import SystemMessage
from langgraph.runtime import Runtime
from pydantic import BaseModel, Field

from langchain.chat_models import init_chat_model
from core.agents.common.base import load_llm_with_dict
from core.agents.document_helper_agent.schema import DocumentHelperState,DocumentHelperRuntime

async def llm_node(state:DocumentHelperState,runtime:Runtime[DocumentHelperRuntime]):
    # 基础信息
    llm_model,user_prompt = await load_llm_with_dict(runtime.context.get("llm_dict"))
    
    pass


