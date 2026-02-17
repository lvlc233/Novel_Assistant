from typing import Annotated, List, TypedDict
from core.agents.common.base import LLMBaseRuntime
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class DocumentHelperRuntime(LLMBaseRuntime):
    pass


class DocumentHelperState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

