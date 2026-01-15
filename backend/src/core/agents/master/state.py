from typing import TypedDict, List, Dict, Any, Annotated
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class MasterState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context: Dict[str, Any]
