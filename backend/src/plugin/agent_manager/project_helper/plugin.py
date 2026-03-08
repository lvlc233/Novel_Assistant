from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_core.messages import HumanMessage

from common.enums import UITrigger, PluginFromTypeEnum
from core.ui.home import Home, ProjectSessionData, ProjectSessionItem
from core.ui.layout import Mailbox
from common.config import settings
from common.model.base_agent import build_agent
from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject
from sqlmodel import select
from typing import List, Any
from uuid import uuid4
from infrastructure.pg.pg_models import AgentsManagerSQLEntity
from loguru import logger 


from plugin.agent_manager.project_helper.agent.agent import graph
from plugin.agent_manager.project_helper.agent.schema import ProjectHelperAgentRuntime, ProjectHelperChatConfigRequest, ProjectHelperChatConfigResponse
from pydantic import BaseModel

class ProjectHelperChatConfigResponse(BaseModel):
    pass

class ProjectHelperChatConfigRequest(BaseModel):
    pass


from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.pg.pg_client import get_session


# def get_project_helper_service(
#     session: AsyncSession = Depends(get_session),
# ) -> ProjectHelperService:
#     return ProjectHelperService(session)
"""
感觉还可以加一个插件之间调度的方式,但是先看看,不着急
"""



async def get_checkpoint() -> AsyncPostgresSaver:
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    return AsyncPostgresSaver.from_conn_string(conn_string)

# @plugin_meta(
#     name="project_helper",
#     space="official", 
#     version="0.0.1",
#     description="项目助手",
#     from_type=PluginFromTypeEnum.SYSTEM,
#     tags=["agent"]
# )
class ProjectHelperPlugin:


    @runtime_config
    def __init__(self, 
                base_url: str = "https://api.openai.com/v1", 
                api_key: str = "", 
                model_name: str = "gpt-3.5-turbo",
                checkpoint: AsyncPostgresSaver = Inject(get_checkpoint),
                session:AsyncSession = Inject(get_session) 
            ):
        """
        插件初始化方法
        
        Args:
            base_url: 项目助手API基础URL
            api_key: 项目助手API密钥
            model_name: 项目助手模型名称
        """
        import os
        self.base_url = base_url or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model_name = model_name or "gpt-3.5-turbo"
        self.checkpoint = checkpoint
        self.session = session

    async def _get_agent_entity(self):
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.name == "project_helper")
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def _ensure_session(self, session_id: str):
        entity = await self._get_agent_entity()
        if not entity:
            return
        sessions = list(entity.sessions or [])
        if session_id not in sessions:
            sessions.append(session_id)
            entity.sessions = sessions
        config = dict(entity.config or {})
        config["current_session_id"] = session_id
        entity.config = config
        await self.session.commit()

    # @operation(
    #     name="quick_input_bottom",
    #     description="底部快速输入",
    #     ui_target=Home.Bottom.filter(),
    #     with_ui=["ProjectChatInput"]
    # )
    # async def quick_input_bottom(self):
    #     """底部快速输入"""
    #     pass

    @operation(
        name="agent_sidebar_item",
        description="邮箱侧边栏入口",
        ui_target=Mailbox.Sidebar.filter(),
        with_ui=["AgentSidebarItem"]
    )
    async def agent_sidebar_item(self, name: str = "项目助手", role: str = "Writing Assistant"):
        """邮箱侧边栏入口"""
        pass

    @operation(
        name="chat_input",
        description="项目助手输入框",
        ui_target=Home.Main.filter(),
        with_ui=["ProjectChatInput"]
    )
    async def chat_input(self):
        """项目助手输入框"""
        pass

    @operation(
        name="get_config",

        description="获取项目助手的配置",
        with_ui=[Home.PluginExpand.PluginCard.filter(name="project_helper")],
        ui_target=Home.PluginExpand.PluginCard.filter(name="project_helper"),
    )
    async def get_config(self) -> ProjectHelperChatConfigResponse:
        """
        获取项目助手的配置
        
        Returns:
            项目助手的配置响应模型
        """
        pass
    
    @operation(
        name="set_config",
        description="设置项目助手的配置",
        with_ui=[Home.PluginExpand.filter()],
        trigger = UITrigger.ENTER
    )
    async def set_config(self, request: ProjectHelperChatConfigRequest) -> None:
        """
        设置项目助手的配置
        
        Args:
            request: 项目助手的配置请求模型
        """
        
        # self.session.add(PluginSQLEntity(
        #     plugin_id="project_helper",
        #     page_id=request.page_id,
        #     config=request.config.model_dump()
        # ))
        # await self.session.commit()
    
    def _format_checkpoint_to_session_item(self, session_id: str, checkpoint: dict) -> ProjectSessionItem:
        """
        Helper to format checkpoint data into ProjectSessionItem.
        """
        channel_values = checkpoint.get("channel_values", {})
        # Assuming "messages" is the key where messages are stored in the state
        messages = channel_values.get("messages", [])
        
        formatted_messages = []
        for msg in messages:
            content = ""
            role = "unknown"
            
            # Handle LangChain/LangGraph message objects or dicts
            if hasattr(msg, "content"):
                content = msg.content
                role = getattr(msg, "type", "unknown")
            elif isinstance(msg, dict):
                content = msg.get("content", "")
                role = msg.get("type", "unknown")
            
            formatted_messages.append({"role": role, "content": content})
            
        # Determine title from the first message or a default
        title = "New Session"
        if formatted_messages:
            # Use the first user message as title if possible
            first_msg_content = formatted_messages[0]["content"]
            title = first_msg_content[:20] + "..." if len(first_msg_content) > 20 else first_msg_content
            
        # Extract metadata
        metadata = checkpoint.get("metadata", {})
        tokens = metadata.get("tokens", 0) # If not available, default to 0
        
        # Timestamp
        ts = checkpoint.get("ts", "")
        
        return {
            "id": session_id,
            "title": title,
            "create_time": str(ts),
            "message_count": len(formatted_messages),
            "tokens": tokens,
            "messages": formatted_messages
        }

    @operation(
        name="get_project_sessions",
        description="获取项目会话列表",
        ui_target=Home.PluginDetails.Info.filter()
    )
    async def get_project_sessions(self):
        """获取项目会话列表"""
        # 1. Query AgentsManagerSQLEntity for "project_helper" to get sessions list
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.name == "project_helper")
        result = await self.session.execute(stmt)
        agent_entity = result.scalars().first()
        
        sessions = []
        if agent_entity and agent_entity.sessions:
            sessions = agent_entity.sessions
            
        project_sessions: List[ProjectSessionItem] = []
        
        # 2. Iterate through sessions and get checkpoints
        async with self.checkpoint as checkpointer:
            for session_id in sessions:
                config = {"configurable": {"thread_id": session_id}}
                checkpoint = await checkpointer.aget(config)
                checkpoint_payload = None
                if isinstance(checkpoint, dict):
                    checkpoint_payload = checkpoint.get("checkpoint", checkpoint)
                elif checkpoint and hasattr(checkpoint, "checkpoint"):
                    checkpoint_payload = checkpoint.checkpoint
                if isinstance(checkpoint_payload, dict):
                    session_item = self._format_checkpoint_to_session_item(session_id, checkpoint_payload)
                    project_sessions.append(session_item)
        
        # 3. Construct ProjectSessionData
        # Grouping by page_id if inferable, otherwise put all in a default "General" page.
        data: ProjectSessionData = {
            "pages": [
                {
                    "id": "general_page",
                    "name": "General",
                    "sessions": project_sessions
                }
            ]
        }
        
        return {
            "info_type": "ProjectSessionManager",
            "data": data
        }

    @operation(
        name="list_sessions",
        description="列出项目助手会话",
        trigger = UITrigger.CLICK
    )
    async def list_sessions(self):
        entity = await self._get_agent_entity()
        if not entity:
            return {"agent_name": "project_helper", "sessions": [], "current_session_id": None}
        return {
            "agent_name": "project_helper",
            "sessions": list(entity.sessions or []),
            "current_session_id": (entity.config or {}).get("current_session_id")
        }

    @operation(
        name="create_session",
        description="创建项目助手会话",
        trigger = UITrigger.CLICK
    )
    async def create_session(self, session_id: str | None = None):
        sid = session_id or f"project_helper-{uuid4()}"
        await self._ensure_session(sid)
        return {"agent_name": "project_helper", "session_id": sid}

    @operation(
        name="switch_session",
        description="切换项目助手会话",
        trigger = UITrigger.CLICK
    )
    async def switch_session(self, session_id: str):
        await self._ensure_session(session_id)
        return {"agent_name": "project_helper", "session_id": session_id}

    @operation(
        name="delete_session",
        description="删除项目助手会话",
        trigger = UITrigger.CLICK
    )
    async def delete_session(self, session_id: str):
        entity = await self._get_agent_entity()
        if not entity:
            return {"agent_name": "project_helper", "deleted": False, "session_id": session_id}
        sessions = [sid for sid in (entity.sessions or []) if sid != session_id]
        entity.sessions = sessions
        config = dict(entity.config or {})
        if config.get("current_session_id") == session_id:
            config["current_session_id"] = sessions[-1] if sessions else None
        entity.config = config
        await self.session.commit()
        return {"agent_name": "project_helper", "deleted": True, "session_id": session_id}
    

    
    
    
    # async def get_registered_pages(self) -> ProjectHelperResourcesResponse:
    #     """
    #     获取页面的卡片信息
        
    #     Args:
    #         page_id: 页面ID
            
    #     Returns:
    #         页面的卡片信息字典
    #     """
    #     pass
    
    
    
    @operation(
        name="chat",
        description="调度ph_agent进行对话",
        with_ui=[Home.ProjectChatInput.filter(name="project_helper")],
        ui_target=Home.EmailBox.AgentBox.filter(name="project_helper"),
        trigger = UITrigger.ENTER
    )
    async def chat(self, message: str, session_id: str):
        """
        调用项目助手智能体
        
        Args:
            message: 用户发送的消息
            session_id: 会话ID (对应 page_id)
            
        yield:
            项目助手智能体的响应流
        """
        page_id = session_id
        config = {"configurable": {"thread_id": page_id}}
        runtime = ProjectHelperAgentRuntime(
            base_url=self.base_url,
            api_key=self.api_key,
            model_name=self.model_name,
        )
        try:
            async with self.checkpoint as checkpointer:
                agent = await build_agent(graph=graph, checkpoint=checkpointer)
                assistant_text_parts: list[str] = []
                seen_tool_dispatch: set[str] = set()
                seen_tool_result: set[str] = set()
                async for event in agent.astream_events(
                    {
                        "messages": [HumanMessage(content=message)],
                        "context": "",
                        "page_id": page_id,
                    },
                    config=config,
                    context=runtime,
                    version="v2",
                ):
                    event_name = str(event.get("event", ""))
                    event_data = event.get("data") or {}
                    if event_name == "on_chat_model_stream":
                        chunk = event_data.get("chunk")
                        chunk_content = getattr(chunk, "content", "")
                        if isinstance(chunk_content, str) and chunk_content:
                            assistant_text_parts.append(chunk_content)
                            yield {"event_type": "assistant_chunk", "content": chunk_content}
                        continue
                    if event_name == "on_tool_start":
                        tool_name = event.get("name")
                        tool_input = event_data.get("input")
                        dispatch_key = f"{tool_name}:{tool_input}"
                        if tool_name and dispatch_key not in seen_tool_dispatch:
                            seen_tool_dispatch.add(dispatch_key)
                            yield {"event_type": "tool_dispatch", "tool_name": tool_name, "args": tool_input}
                        continue
                    if event_name == "on_tool_end":
                        tool_name = event.get("name")
                        tool_output = event_data.get("output")
                        result_key = f"{tool_name}:{tool_output}"
                        if result_key not in seen_tool_result:
                            seen_tool_result.add(result_key)
                            yield {"event_type": "tool_result", "tool_name": tool_name, "content": str(tool_output)}
                        continue

                if not assistant_text_parts:
                    state_snapshot = await agent.aget_state(config)
                    if state_snapshot and isinstance(state_snapshot.values, dict):
                        messages = state_snapshot.values.get("messages", [])
                        if isinstance(messages, list):
                            for msg in messages:
                                msg_type = getattr(msg, "type", "") or (
                                    msg.get("type", "")
                                    if isinstance(msg, dict)
                                    else ""
                                )
                                if msg_type != "ai":
                                    continue
                                content = getattr(msg, "content", "") or (
                                    msg.get("content", "")
                                    if isinstance(msg, dict)
                                    else ""
                                )
                                if isinstance(content, str) and content:
                                    yield {"event_type": "assistant_chunk", "content": content}
        except Exception as e:
            yield {"status": "error", "message": f"项目助手请求失败: {type(e).__name__}: {str(e)}"}
            
