import operator
from typing import Annotated, Any, Dict, List, Tuple, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class Allocation(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context: Dict[str, Any]
    documents: List[str]
    # Collect all cyphers from parallel executions
    cypher: Annotated[List[str], operator.add]

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
    cypher: Annotated[List[str], operator.add]
