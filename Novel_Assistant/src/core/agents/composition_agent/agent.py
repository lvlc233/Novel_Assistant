
from typing import Annotated,List
from copilotkit.langgraph import HumanMessage
from pydantic import BaseModel,Field

from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import BaseMessage
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

class CompositionAgentState(BaseModel):
    # 基础信息相关
    messages:Annotated[List[BaseMessage],]=Field(default_factory=list,description="用于历史记录恢复")
    agent_context:List[BaseMessage]=Field(description="对于Agent可见的上下文信息。")
    human_query:HumanMessage=Field(description="用户的查询")
    agent_response:BaseMessage=Field(description="Agent的回复")
    # 其他信息
    current_document_content:str=Field(description="当前文档的内容:用于前后端状态同步,使Agent可以实时的阅读到最新的文档")
    quantized_gated_attention:float=Field(description="量化门控注意力:用于解决上下文中全文档的token偏移问题:暂时搁置。")    


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
