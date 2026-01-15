from typing import TypedDict, List, Dict, Any, Tuple, Annotated
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class Allocation(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context: Dict[str, Any]
    documents: List[str]

class KDBuildState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context: Dict[str, Any]
    
    document: str
    chunks: List[str]
    # Attention
    now_chunk_index: int
    attention_chunk: Dict[int, List[str]]
    
    # Entity
    atom_entity: List[str]
    dependence_entity: List[str]

    full_node: Dict[str, Dict[str, Any]]
    relation: List[Tuple[str, str, str]]

    # Cypher
    cypher: List[str]
