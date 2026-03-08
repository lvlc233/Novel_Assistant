from langchain_core.messages import BaseMessage
from langchain_core.tools import BaseTool
from langgraph.graph import add_messages
from common.model.base_agent import BaseAgentRuntime
from common.utils.utils import create_uuid
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Any, List, Optional, TypedDict

class DocumentHelpAgentRuntime(BaseAgentRuntime):
    session_id: str = create_uuid()
    tools: List[BaseTool] = []
    user_prompt: str
    document_content: str
    document_title: Optional[str]
    session: AsyncSession
    work_id: Optional[str]
    document_id: Optional[str]
    version_id: Optional[str]

class DocumentHelpAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context: str
    pending_tool_calls: List[dict[str, Any]]
    current_tool_call: Optional[dict[str, Any]]
    step_count: int
