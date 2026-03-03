from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.agent.schema import (
    AgentDetailResponse,
    AgentMessagesResponse,
    AgentMetaResponse,
    AgentUpdateRequest,
    MessagesSendRequest,
)
from infrastructure.pg.pg_client import get_session
from services.agent.service import AgentService

router = APIRouter(prefix="/plugin/agent/manager", tags=["agents"])

def get_agent_service(session: AsyncSession = Depends(get_session)) -> AgentService:
    return AgentService(session)

# --- Spec Endpoints ---

@router.get("", response_model=Response[List[AgentMetaResponse]])
async def get_agent_list(
    service: AgentService = Depends(get_agent_service)
) -> Response[List[AgentMetaResponse]]:
    """获取Agent列表."""
    data = await service.get_agent_list()
    return Response.ok(data=data)

@router.get("/{agent_id}", response_model=Response[AgentDetailResponse])
async def get_agent_detail(
    agent_id: str,
    service: AgentService = Depends(get_agent_service)
) -> Response[AgentDetailResponse]:
    """获取Agent详情."""
    data = await service.get_agent_detail(agent_id)
    return Response.ok(data=data)

@router.post("/{agent_id}/history/{session_id}", response_model=Response[AgentMessagesResponse])
async def create_session(
    agent_id: str,
    session_id: str,
    service: AgentService = Depends(get_agent_service)
) -> Response[AgentMessagesResponse]:
    """会话创建."""
    data = await service.create_session(agent_id, session_id)
    return Response.ok(data=data)

@router.post("/{agent_id}/history/{session_id}/messages")
async def send_message(
    agent_id: str,
    session_id: str,
    request: MessagesSendRequest,
    service: AgentService = Depends(get_agent_service)
) -> StreamingResponse:
    """Agent发送消息 (SSE)."""
    return StreamingResponse(
        service.send_message(agent_id, session_id, request),
        media_type="text/event-stream"
    )

@router.patch("/{agent_id}", response_model=Response[None])
async def update_agent(
    agent_id: str,
    request: AgentUpdateRequest,
    service: AgentService = Depends(get_agent_service)
) -> Response[None]:
    """Agent修改."""
    await service.update_agent(agent_id, request)
    return Response.ok()

