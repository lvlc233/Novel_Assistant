from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.agent.schema import (
    AgentResponse,
    CreateAgentRequest,
    UpdateAgentRequest,
)
from common.errors import ResourceNotFoundError

# Import compiled graphs
from core.agents.composition.graph import composition_agent
from core.agents.kd_builder.graph import kd_build_agent
from core.agents.master.graph import master_agent
from core.agents.outline.graph import outline_agent
from infrastructure.pg.pg_models import AgentsManagerSQLEntity


class AgentService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_agent(self, request: CreateAgentRequest) -> AgentResponse:
        """创建Agent."""
        agent = AgentsManagerSQLEntity(
            name=request.name,
            description=request.description,
            agent_type=request.agent_type,
            config=request.config,
            broadcast=request.broadcast
        )
        self.session.add(agent)
        await self.session.commit()
        await self.session.refresh(agent)
        
        return self._to_response(agent)

    async def get_agent_list(self) -> List[AgentResponse]:
        """获取Agent列表."""
        stmt = select(AgentsManagerSQLEntity)
        result = await self.session.execute(stmt)
        agents = result.scalars().all()
        return [self._to_response(agent) for agent in agents]

    async def get_agent_detail(self, agent_id: str) -> AgentResponse:
        """获取Agent详情."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
        return self._to_response(agent)

    async def update_agent(self, agent_id: str, request: UpdateAgentRequest) -> AgentResponse:
        """更新Agent."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
            
        if request.name is not None:
            agent.name = request.name
        if request.description is not None:
            agent.description = request.description
        if request.config is not None:
            agent.config = request.config
        if request.enabled is not None:
            agent.enabled = request.enabled
        if request.broadcast is not None:
            agent.broadcast = request.broadcast
            
        await self.session.commit()
        await self.session.refresh(agent)
        return self._to_response(agent)

    async def invoke_agent(self, agent_id: str, input_data: Dict[str, Any], thread_id: str) -> Dict[str, Any]:
        """调用Agent."""
        # 1. Get Agent Entity
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
        if not agent.enabled:
            raise ResourceNotFoundError(f"Agent {agent_id} is disabled")
            
        # 2. Select Graph based on type
        graph = None
        if agent.agent_type == "composition":
            graph = composition_agent
        elif agent.agent_type == "master":
            graph = master_agent
        elif agent.agent_type == "outline":
            graph = outline_agent
        elif agent.agent_type == "kd_builder":
            graph = kd_build_agent
        else:
            raise ValueError(f"Unsupported agent type: {agent.agent_type}")
            
        # 3. Invoke with checkpointer config
        config = {"configurable": {"thread_id": thread_id}}
        
        # TODO: Handle input adaptation if necessary
        result = await graph.ainvoke(input_data, config=config)
        return result

    def _to_response(self, agent: AgentsManagerSQLEntity) -> AgentResponse:
        return AgentResponse(
            id=agent.id,
            name=agent.name,
            description=agent.description,
            agent_type=agent.agent_type,
            enabled=agent.enabled,
            broadcast=agent.broadcast,
            config=agent.config
        )

    async def delete_agent(self, agent_id: str) -> None:
        """删除Agent."""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.id == agent_id)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        
        if not agent:
            raise ResourceNotFoundError(f"Agent {agent_id} not found")
            
        await self.session.delete(agent)
        await self.session.commit()
