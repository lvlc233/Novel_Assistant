from typing import TypedDict, List, Dict, Any, Annotated
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage, HumanMessage

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
