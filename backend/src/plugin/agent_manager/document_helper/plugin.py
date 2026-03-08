from typing import Any, List, Optional, Annotated
from uuid import uuid4
from core.plugin.annotations import plugin_meta, operation, runtime_config, UIParamSourceEnum, UITrigger
from core.plugin.di import Inject
from common.enums import PluginFromTypeEnum
from core.ui.layout import Editor, Mailbox
from core.ui.home import Home, DocumentSessionData
from core.ui.base import Component
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
# from langgraph.types import Command
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from common.config import settings
from infrastructure.pg.pg_client import async_session
from infrastructure.pg.pg_models import AgentsManagerSQLEntity
from plugin.agent_manager.document_helper.agent.agent import build_agent
from loguru import logger

async def get_checkpoint() -> AsyncPostgresSaver:
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    return AsyncPostgresSaver.from_conn_string(conn_string)

class Assistant(Component):
    def __init__(self, title: str = "Document Assistant"):
        self.title = title

class DocumentHelperChatConfigResponse(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

class DocumentHelperChatConfigRequest(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

@plugin_meta(
    name="文档助手",
    space="official", 
    version="0.0.1",
    description="文档助手",
    from_type=PluginFromTypeEnum.SYSTEM,
    tags=["agent", "doc_agent"]
)
class DocumentHelperPlugin:
    
    
    @runtime_config
    def __init__(self, 
                base_url: str = "https://api.openai.com/v1", 
                api_key: str = "", 
                model_name: str = "gpt-3.5-turbo",
                user_prompt: str = "",
                checkpoint: AsyncPostgresSaver = Inject(get_checkpoint)):
        import os
        self.base_url = base_url or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model_name = model_name or "gpt-3.5-turbo"
        self.user_prompt = user_prompt
        self.checkpoint = checkpoint

    async def _get_agent_entity(self, session: AsyncSession):
        stmt = select(AgentsManagerSQLEntity).where(
            AgentsManagerSQLEntity.name.in_(["document_helper", "文档助手"])
        )
        result = await session.execute(stmt)
        return result.scalars().first()

    async def _ensure_session(self, session: AsyncSession, session_id: str):
        entity = await self._get_agent_entity(session)
        if not entity:
            return
        sessions = list(entity.sessions or [])
        if session_id not in sessions:
            sessions.append(session_id)
            entity.sessions = sessions
        config = dict(entity.config or {})
        config["current_session_id"] = session_id
        entity.config = config
        await session.commit()

    def _message_type_to_role(self, message_type: str) -> str:
        if message_type == "human":
            return "user"
        if message_type == "ai":
            return "assistant"
        return message_type or "unknown"

    def _normalize_message_content(self, content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str) and text:
                        parts.append(text)
            return "".join(parts)
        return str(content)

    async def _get_checkpoint_messages(self, session_id: str) -> list[dict[str, Any]]:
        checkpoint_tuple = await self.checkpoint.aget({"configurable": {"thread_id": session_id}})
        checkpoint_payload = None
        if isinstance(checkpoint_tuple, dict):
            checkpoint_payload = checkpoint_tuple.get("checkpoint", checkpoint_tuple)
        elif checkpoint_tuple and hasattr(checkpoint_tuple, "checkpoint"):
            checkpoint_payload = checkpoint_tuple.checkpoint
        if not isinstance(checkpoint_payload, dict):
            return []
        channel_values = checkpoint_payload.get("channel_values", {})
        if not isinstance(channel_values, dict):
            return []
        raw_messages = channel_values.get("messages", [])
        if not isinstance(raw_messages, list):
            return []
        normalized_messages: list[dict[str, Any]] = []
        for message in raw_messages:
            msg_dict = {}
            if isinstance(message, dict):
                message_type = str(message.get("type", ""))
                content = self._normalize_message_content(message.get("content", ""))
                msg_dict = message
            else:
                message_type = str(getattr(message, "type", ""))
                content = self._normalize_message_content(getattr(message, "content", ""))
                # Try to dump model to dict if possible, or extract fields
                if hasattr(message, "model_dump"):
                    msg_dict = message.model_dump()
                else:
                    msg_dict = message.__dict__ if hasattr(message, "__dict__") else {}

            payload = {
                "type": message_type,
                "role": self._message_type_to_role(message_type),
                "content": content,
                "id": msg_dict.get("id") or str(uuid4()),
                "name": msg_dict.get("name"),
                "tool_call_id": msg_dict.get("tool_call_id"),
                "tool_calls": msg_dict.get("tool_calls", []),
            }
            normalized_messages.append(payload)
        return normalized_messages

    def _extract_current_turn_messages(self, messages: list):
        current_turn = []
        for msg in reversed(messages):
            msg_type = getattr(msg, "type", "") or (msg.get("type", "") if isinstance(msg, dict) else "")
            if msg_type == "human":
                break
            current_turn.append(msg)
        return list(reversed(current_turn))

    async def _emit_agent_result_events(self, result: dict):
        # interrupts = result.get("__interrupt__")
        # if interrupts:
        #     payload = []
        #     for item in interrupts:
        #         payload.append(getattr(item, "value", item))
        #     yield {"event_type": "hitl_interrupt", "payload": payload}
        #     return
        current_turn_messages = self._extract_current_turn_messages(result.get("messages", []))
        assistant_text_parts: list[str] = []
        for msg in current_turn_messages:
            msg_type = getattr(msg, "type", "") or (msg.get("type", "") if isinstance(msg, dict) else "")
            if msg_type == "ai":
                tool_calls = getattr(msg, "tool_calls", None)
                if tool_calls:
                    for call in tool_calls:
                        yield {
                            "event_type": "tool_dispatch",
                            "tool_name": call.get("name"),
                            "args": call.get("args"),
                        }
                content = getattr(msg, "content", "")
                if isinstance(content, str) and content:
                    assistant_text_parts.append(content)
            if msg_type == "tool":
                yield {
                    "event_type": "tool_result",
                    "tool_name": getattr(msg, "name", None),
                    "content": str(getattr(msg, "content", "")),
                }
        if assistant_text_parts:
            final_text = "".join(assistant_text_parts)
            yield {"event_type": "assistant_chunk", "content": final_text}

    async def _stream_agent_execution(
        self,
        agent: Any,
        agent_input: Any,
        session_id: str,
    ):
        config = {"configurable": {"thread_id": session_id}}
        assistant_text_parts: list[str] = []
        seen_tool_dispatch: set[str] = set()
        seen_tool_result: set[str] = set()
        async for event in agent.astream_events(agent_input, config=config, version="v2"):
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
        final_values: dict = {}
        try:
            state_snapshot = await agent.aget_state(config)
            if state_snapshot and isinstance(state_snapshot.values, dict):
                final_values = state_snapshot.values
        except Exception:
            final_values = {}
        # interrupts = final_values.get("__interrupt__")
        # if interrupts:
        #     payload = []
        #     for item in interrupts:
        #         payload.append(getattr(item, "value", item))
        #     yield {"event_type": "hitl_interrupt", "payload": payload}
        #     return
        if not assistant_text_parts and final_values:
            current_turn_messages = self._extract_current_turn_messages(final_values.get("messages", []))
            for msg in current_turn_messages:
                msg_type = getattr(msg, "type", "") or (msg.get("type", "") if isinstance(msg, dict) else "")
                if msg_type == "ai":
                    content = getattr(msg, "content", "")
                    if isinstance(content, str) and content:
                        assistant_text_parts.append(content)
                        yield {"event_type": "assistant_chunk", "content": content}

    @operation(
        name="editor_assistant",
        description="文档助手侧边栏",
        ui_target=Editor.Sidebar.filter(),
        with_ui=["AIAssistant"]
    )
    async def editor_assistant(self):
        """文档助手侧边栏"""
        return {"title": "AI Assistant"}

    # @operation(
    #     name="resume_human_review",
    #     description="恢复文档助手人工审核流程",
    #     trigger=UITrigger.CLICK
    # )
    # async def resume_human_review(
    #     self,
    #     session_id: str,
    #     decision: str,
    #     edited_action: Optional[dict] = None,
    #     document_content: Annotated[str, UIParamSourceEnum.CONTEXT, "document_content"] = "",
    #     document_title: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "document_title"] = None,
    #     work_id: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "work_id"] = None,
    #     document_id: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "document_id"] = None,
    #     version_id: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "version_id"] = None,
    # ):
    #     if not self.api_key:
    #         yield {"status": "error", "message": "文档助手未配置 API Key"}
    #         return
    #     
    #     async with async_session() as session:
    #         runtime = {
    #             "model_name": self.model_name,
    #             "api_key": self.api_key,
    #             "base_url": self.base_url,
    #             "session_id": session_id,
    #             "document_content": document_content,
    #             "document_title": document_title,
    #             "user_prompt": self.user_prompt,
    #             "tools": [],
    #             "session": session,
    #             "work_id": work_id,
    #             "document_id": document_id,
    #             "version_id": version_id,
    #         }
    #         agent = await build_agent(runtime, self.checkpoint)
    #         if decision not in {"approve", "edit", "reject"}:
    #             yield {"status": "error", "message": f"不支持的审核决策: {decision}"}
    #             return
    #         decision_payload = {"type": decision}
    #         if decision == "edit" and edited_action is not None:
    #             decision_payload["edited_action"] = edited_action
    #         async for event in self._stream_agent_execution(
    #             agent,
    #             Command(resume={"decisions": [decision_payload]}),
    #             session_id,
    #         ):
    #             yield event

    @operation(
        name="chat",
        description="与文档对话",
        with_ui=[Assistant.filter()],
        ui_target=Assistant, # This might need a specific slot for messages or stream back to component
        trigger=UITrigger.ENTER
    )
    async def chat(
        self, 
        message: str, 
        document_content: Annotated[str, UIParamSourceEnum.CONTEXT, "document_content"] = "",
        document_title: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "document_title"] = None,
        session_id: str = "",
        work_id: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "work_id"] = None,
        document_id: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "document_id"] = None,
        version_id: Annotated[Optional[str], UIParamSourceEnum.CONTEXT, "version_id"] = None,
    ):
        """与文档内容对话"""
        if not self.api_key:
            yield {"status": "error", "message": "文档助手未配置 API Key"}
            return
        sid = session_id or f"document_helper-{uuid4()}"
        try:
            async with async_session() as session:
                await self._ensure_session(session, sid)
                runtime = {
                    "model_name": self.model_name,
                    "api_key": self.api_key,
                    "base_url": self.base_url,
                    "session_id": sid,
                    "document_content": document_content,
                    "document_title": document_title,
                    "user_prompt": self.user_prompt,
                    "tools": [],
                    "session": session,
                    "work_id": work_id,
                    "document_id": document_id,
                    "version_id": version_id,
                }
                async with self.checkpoint as checkpointer:
                    agent = await build_agent(runtime, checkpointer)
                    async for event in self._stream_agent_execution(
                        agent,
                        {
                            "messages": [HumanMessage(content=message)],
                            "context": "",
                            "pending_tool_calls": [],
                            "current_tool_call": None,
                            "step_count": 0,
                        },
                        sid,
                    ):
                        yield event
        except Exception as e:
            yield {"status": "error", "message": f"文档助手请求失败: {type(e).__name__}: {str(e)}"}

    @operation(
        name="editor_assistant",
        description="文档助手侧边栏",
        ui_target=Editor.Sidebar.filter(),
        with_ui=["AIAssistant"]
    )
    async def editor_assistant(self):
        """文档助手侧边栏"""
        return {"title": "AI Assistant"}

    @operation(
        name="agent_sidebar_item",
        description="邮箱侧边栏入口",
        ui_target=Mailbox.Sidebar.filter(),
        with_ui=["AgentSidebarItem"]
    )
    async def agent_sidebar_item(self, name: str = "文档助手", role: str = "Editor"):
        """邮箱侧边栏入口"""
        pass

    @operation(name="get_config")
    async def get_config(self) -> DocumentHelperChatConfigResponse:
        """获取文档创作Chat助手的配置."""
        return DocumentHelperChatConfigResponse(
            model_name=self.model_name,
            base_url=self.base_url,
            api_key=self.api_key,
            user_prompt=self.user_prompt
        )

    @operation(name="update_config")
    async def update_config(self, request: DocumentHelperChatConfigRequest) -> None:
        """修改文档创作Chat助手的配置."""
        # 配置更新逻辑通常由框架层处理，这里可能需要持久化到数据库
        # 或者仅仅作为运行时配置的更新
        pass

    @operation(
        name="get_document_sessions",
        description="获取文档会话列表",
        ui_target=Home.PluginDetails.Info.filter()
    )
    async def get_document_sessions(self):
        async with async_session() as session:
            entity = await self._get_agent_entity(session)
            sessions = list(entity.sessions or []) if entity else []
            session_items = []
            for sid in sessions:
                history = await self._get_checkpoint_messages(sid)
                title = "新会话"
                for msg in history:
                    if msg.get("role") == "user" and msg.get("content"):
                        content = str(msg["content"])
                        title = content[:20] + ("..." if len(content) > 20 else "")
                        break
                session_items.append(
                    {
                        "id": sid,
                        "title": title,
                        "create_time": "",
                        "message_count": len(history),
                        "tokens": 0,
                        "messages": history,
                    }
                )
            data: DocumentSessionData = {"documents": [{"id": "default_doc", "title": "当前文档", "sessions": session_items}]}
            return {
                "info_type": "DocumentSessionManager",
                "data": data
            }

    @operation(
        name="list_sessions",
        description="列出文档助手会话",
        trigger = UITrigger.CLICK
    )
    async def list_sessions(self):
        async with async_session() as session:
            entity = await self._get_agent_entity(session)
            if not entity:
                return {"agent_name": "document_helper", "sessions": [], "current_session_id": None}
            return {
                "agent_name": "document_helper",
                "sessions": list(entity.sessions or []),
                "current_session_id": (entity.config or {}).get("current_session_id")
            }

    @operation(
        name="create_session",
        description="创建文档助手会话",
        trigger = UITrigger.CLICK
    )
    async def create_session(self, session_id: str | None = None):
        sid = session_id or f"document_helper-{uuid4()}"
        async with async_session() as session:
            await self._ensure_session(session, sid)
            return {"agent_name": "document_helper", "session_id": sid}

    @operation(
        name="switch_session",
        description="切换文档助手会话",
        trigger = UITrigger.CLICK
    )
    async def switch_session(self, session_id: str):
        async with async_session() as session:
            await self._ensure_session(session, session_id)
            return {"agent_name": "document_helper", "session_id": session_id}

    @operation(
        name="delete_session",
        description="删除文档助手会话",
        trigger = UITrigger.CLICK
    )
    async def delete_session(self, session_id: str):
        async with async_session() as session:
            entity = await self._get_agent_entity(session)
            if not entity:
                return {"agent_name": "document_helper", "deleted": False, "session_id": session_id}
            sessions = [sid for sid in (entity.sessions or []) if sid != session_id]
            entity.sessions = sessions
            config = dict(entity.config or {})
            if config.get("current_session_id") == session_id:
                config["current_session_id"] = sessions[-1] if sessions else None
            entity.config = config
            await session.commit()
            return {"agent_name": "document_helper", "deleted": True, "session_id": session_id}
