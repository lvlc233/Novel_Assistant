from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.agent.schema import (
    AgentResponse,
    CreateAgentRequest,
    InvokeAgentRequest,
    InvokeAgentResponse,
    UpdateAgentRequest,
)
from infrastructure.pg.pg_client import get_session
from services.agent.service import AgentService

router = APIRouter(prefix="/plugin/agent/manager", tags=["agents"])

def get_agent_service(session: AsyncSession = Depends(get_session)) -> AgentService:
    return AgentService(session)

@router.post("", response_model=Response[AgentResponse])
async def create_agent(
    request: CreateAgentRequest,
    service: AgentService = Depends(get_agent_service)
) -> Response[AgentResponse]:
    """创建Agent."""
    data = await service.create_agent(request)
    return Response.ok(data=data)

@router.get("", response_model=Response[List[AgentResponse]])
async def get_agent_list(
    service: AgentService = Depends(get_agent_service)
) -> Response[List[AgentResponse]]:
    """获取Agent列表."""
    data = await service.get_agent_list()
    return Response.ok(data=data)

@router.get("/{agent_id}", response_model=Response[AgentResponse])
async def get_agent_detail(
    agent_id: str,
    service: AgentService = Depends(get_agent_service)
) -> Response[AgentResponse]:
    """获取Agent详情."""
    data = await service.get_agent_detail(agent_id)
    return Response.ok(data=data)

@router.patch("/{agent_id}", response_model=Response[AgentResponse])
async def update_agent(
    agent_id: str,
    request: UpdateAgentRequest,
    service: AgentService = Depends(get_agent_service)
) -> Response[AgentResponse]:
    """更新Agent."""
    data = await service.update_agent(agent_id, request)
    return Response.ok(data=data)

@router.post("/{agent_id}/invoke", response_model=Response[InvokeAgentResponse])
async def invoke_agent(
    agent_id: str,
    request: InvokeAgentRequest,
    service: AgentService = Depends(get_agent_service)
) -> Response[InvokeAgentResponse]:
    """调用Agent (带记忆)."""
    data = await service.invoke_agent(agent_id, request.input, request.thread_id)
    return Response.ok(data=InvokeAgentResponse(output=data))

@router.delete("/{agent_id}", response_model=Response[None])
async def delete_agent(
    agent_id: str,
    service: AgentService = Depends(get_agent_service)
) -> Response[None]:
    """删除Agent."""
    await service.delete_agent(agent_id)
    return Response.ok()
