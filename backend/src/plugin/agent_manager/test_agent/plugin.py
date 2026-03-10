import configparser
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_core.messages import HumanMessage

from common.enums import UITrigger, PluginFromTypeEnum
from core.ui.home import Home
from common.config import settings

from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject


async def get_checkpoint() -> AsyncPostgresSaver:
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    return AsyncPostgresSaver.from_conn_string(conn_string)

@plugin_meta(
    name="测试Agent",
    space="test", 
    version="0.0.1",
    description="测试用的Agent",
    from_type=PluginFromTypeEnum.CUSTOM,
    tags=["agent","tool"]
)
class ProjectHelperPlugin:
    @runtime_config
    def __init__(self, model_name:str,api_key:str,base_url:str,checkpoint:AsyncPostgresSaver = Inject(get_checkpoint)):
        self.model_name=model_name
        self.api_key=api_key
        self.base_url=base_url
        self.checkpoint = checkpoint
    @operation(
        name="chat",
        description="测试",
        with_ui=[Home.ProjectChatInput.filter(name="测试Agent")],
        ui_target=Home.EmailBox.AgentBox.filter(name="测试Agent"),
        trigger = UITrigger.ENTER
    )
    async def chat(self, message: str, session_id: str):
        llm =  ChatOpenAI(
            model=self.model_name,
            api_key=self.api_key,
            base_url=self.base_url,
        )
        from langchain.agents import create_agent
        async with self.checkpoint as c:
            agent =  create_agent(
                model=llm,
                tools=[],
                checkpointer=c
            )
            async for chunk in agent.astream({"messages":[HumanMessage(content=message)]},config = {"configurable": {"thread_id": session_id}}):
                    yield {"event_type": "assistant_chunk", "content": chunk.get("context")}
    

            
