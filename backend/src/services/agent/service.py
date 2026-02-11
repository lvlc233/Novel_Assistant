"""Agent Service Module."""
import json
from typing import AsyncGenerator, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.agent.schema import (
    AgentDetailResponse,
    AgentMessagesResponse,
    AgentMetaResponse,
    AgentUpdateRequest,
    MessagesSendRequest,
)
from common.errors import ResourceNotFoundError
from core.agents.kd_builder.graph import kd_build_agent
from infrastructure.pg.pg_models import AgentsManagerSQLEntity


class AgentService:
    """Agent Service Class."""
    def __init__(self, session: AsyncSession):
        """Initialize AgentService."""
        self.session = session

        
    async def delete_agent(self, agent_id: str) -> None:
        """删除Agent (Internal)."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        if agent:
            await self.session.delete(agent)
            await self.session.commit()

    # --- Spec Methods ---

    async def get_agent_list(self) -> List[AgentMetaResponse]:
        """获取Agent列表."""
        stmt = select(AgentsManagerSQLEntity)
        result = await self.session.execute(stmt)
        agents = result.scalars().all()
        return [
            AgentMetaResponse(
                id=agent.id,
                enabled=agent.enabled,
                name=agent.name,
                broadcast=agent.broadcast,
                description=agent.description,
                create_at=agent.create_at
            )
            for agent in agents
        ]

    async def get_agent_detail(self, agent_id: str) -> AgentDetailResponse:
        """获取Agent详情."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
            
        return AgentDetailResponse(
            id=agent.id,
            enabled=agent.enabled,
            name=agent.name,
            broadcast=agent.broadcast,
            context_size=agent.config.get("context_size", -1),
            is_summary=agent.config.get("is_summary", False),
            description=agent.description,
            create_at=agent.create_at,
            sessions=agent.sessions or []
        )

    async def update_agent(self, agent_id: str, request: AgentUpdateRequest) -> None:
        """更新Agent."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
            
        agent.broadcast = request.broadcast
        await self.session.commit()

    async def create_session(self, agent_id: str, session_id: str) -> AgentMessagesResponse:
        """会话创建."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
            
        if session_id not in agent.sessions:
            new_histories = list(agent.sessions)
            new_histories.append(session_id)
            agent.sessions = new_histories
            await self.session.commit()
            
        return AgentMessagesResponse(
            session_id=UUID(session_id),
            messages=[]
        )

    async def send_message(self, agent_id: str, session_id: str, request: MessagesSendRequest) -> AsyncGenerator[str, None]:
        """Agent发送消息 (SSE)."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
        if not agent.enabled:
            raise ResourceNotFoundError(f"Agent {agent_id} is disabled")
            
        # Select Graph
        graph = None
        if agent.t == "composition":
            graph = composition_agent
        elif agent.agent_type == "master":
            graph = master_agent
        elif agent.agent_type == "outline":
            graph = outline_agent
        elif agent.agent_type == "kd_builder":
            graph = kd_build_agent
            
        if not graph:
            # Fallback or error if graph not found
            yield f"event: error\ndata: {json.dumps({'error': 'Graph not found'})}\n\n"
            return

        config = {"configurable": {"thread_id": session_id}}
        # Assuming simple input structure. Adjust based on actual graph requirements.
        input_data = {"messages": [("user", request.context)]} 
        
        try:
            async for event in graph.astream_events(input_data, config, version="v1"):
                # Simplified event filtering
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        # Follow standard SSE format
                        # id: ...
                        # event: ...
                        # data: ...
                        event_id = f"{agent.name}:{session_id}"
                        # Ensure data is JSON encoded string if it's complex, or raw string if text
                        # Here content is string.
                        # Spec says data: any. Let's json dump it to be safe and consistent.
                        yield f"id: {event_id}\nevent: message\ndata: {json.dumps(content)}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
