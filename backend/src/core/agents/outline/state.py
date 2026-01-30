from typing import Annotated, List, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class OutlineState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    # Context specific to outlining
    novel_title: str
    novel_genre: str
    outline_content: str
