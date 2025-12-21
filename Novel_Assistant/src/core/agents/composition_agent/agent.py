
from pydantic import BaseModel,Field

from sqlalchemy.ext.asyncio import AsyncSession

from langchain.agents import create_agent
from langgraph.prebuilt.tool_node import ToolRuntime
from langgraph.graph.state import CompiledStateGraph
from langgraph.checkpoint.memory import MemorySaver

from common.utils import load_chat_model

from common.clients.pg.pg_client import PGClient,get_session


class CompositionAgentRuntimeContext(BaseModel):
    user_id:str=Field(...,description="用户id:(必选)")
    current_document_id:str=Field(...,description="当前文档id:(必选)")
    session_id:AsyncSession=Field(default_factory=lambda: get_session(),description="数据库连接会话id:(自动)")

"""
    写作助手
    1. 对当前文档进行操作。

"""
composition_agent: CompiledStateGraph=create_agent(
    model=load_chat_model(),
    tools=[],
    system_prompt="你是一个专业的小说助手,可以回答用户关于小说的问题.",
    checkpointer=MemorySaver(),
    context_schema=CompositionAgentRuntimeContext
)

# 阅读当前文档的工具
async def read_current_document(runtime:ToolRuntime):
    # current_document_id=runtime.context.current_document_id
    session_id=runtime.context["session_id"]
    client=PGClient(session_id) 
    client.get_document()
    pass