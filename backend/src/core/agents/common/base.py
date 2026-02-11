from ast import Tuple
from typing import  List, TypedDict

from langchain.chat_models import BaseChatModel, init_chat_model
from common.errors import BaseError
from core.agents.common.tool_register import get_tool_in_plugin
# LLM的基础运行时对象
class LLMBaseRuntime(TypedDict):
    model_name: str
    base_url: str
    api_key: str
    
    user_prompt: str|None = None
    tools:List[str] = []


class ModelLoadError(BaseError):
    def __init__(self, type: str):
        super().__init__(62001, message=f"模型加载失败: {type} 为空")
        self.type = type

async def load_llm_with_dict(llm_dict: LLMBaseRuntime)->Tuple[BaseChatModel,str|None]:
    model_name = llm_dict.get("model_name", None)
    if model_name is None:
        raise ModelLoadError("model_name")
    base_url = llm_dict.get("base_url", None)
    if base_url is None:
        raise ModelLoadError("base_url")    
    api_key = llm_dict.get("api_key", None)
    if api_key is None:
        raise ModelLoadError("api_key")
    
    tool_names = llm_dict.get("tools", [])
    
    tools = await get_tool_in_plugin(tool_names)

    llm_model = init_chat_model(
        model=model_name,
        model_provider ="openai",
        base_url=base_url,
        api_key=api_key,
    ).bind_tools[tools]
    
    
    user_prompt = llm_dict.get("user_prompt", None)
    
    return llm_model,user_prompt
    