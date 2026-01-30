from typing import Annotated, Any, Dict, List, TypedDict

from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import add_messages


class CompositionState(TypedDict):
    # Base
    messages: Annotated[List[BaseMessage], add_messages]
    context: Dict[str, Any]
    
    # Specific
    agent_context: List[BaseMessage]
    human_query: HumanMessage
    agent_response: BaseMessage
    current_document_content: str
    quantized_gated_attention: float
