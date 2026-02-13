from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.agent.schema import (
    MessagesSendRequest,
)
from api.routes.agent.project_helper.schema import (
    ProjectHelperChatConfigRequest,
    ProjectHelperChatConfigResponse,
    ProjectHelperResourcesRequest,
    ProjectHelperResourcesResponse,
)
from infrastructure.pg.pg_client import get_session
from services.agent.project_helper_service import ProjectHelperService

router = APIRouter(prefix="/plugin/agent/project_helper", tags=["agent-project-helper"])

# 变更记录:
# 注释者: BackendAgent(python)
# 时间: 2026-02-13 01:50:00
# 使用位置: 项目助手路由配置/资源接口
# 实现概述: 接入 ProjectHelperService 并移除内存模拟逻辑

def get_project_helper_service(
    session: AsyncSession = Depends(get_session),
) -> ProjectHelperService:
    return ProjectHelperService(session)

@router.get("/config", response_model=Response[ProjectHelperChatConfigResponse])
async def get_config(
    service: ProjectHelperService = Depends(get_project_helper_service),
) -> Response[ProjectHelperChatConfigResponse]:
    """获取项目chat助手的配置."""
    data = await service.get_config()
    return Response.ok(data=data)

@router.post("/config", response_model=Response[None])
async def update_config(
    request: ProjectHelperChatConfigRequest,
    service: ProjectHelperService = Depends(get_project_helper_service),
) -> Response[None]:
    """修改项目chat助手的配置."""
    await service.update_config(request)
    return Response.ok()

@router.get("/resources", response_model=Response[List[ProjectHelperResourcesResponse]])
async def get_resources(
    service: ProjectHelperService = Depends(get_project_helper_service),
) -> Response[List[ProjectHelperResourcesResponse]]:
    """获取项目chat助手的资源."""
    data = await service.get_resources()
    return Response.ok(data=data)

@router.post("/resources", response_model=Response[None])
async def update_resources(
    request: ProjectHelperResourcesRequest,
    service: ProjectHelperService = Depends(get_project_helper_service),
) -> Response[None]:
    """修改项目chat助手的资源."""
    await service.update_resources(request)
    return Response.ok()

@router.post("/chat/{session_id}")
async def chat(session_id: str, request: MessagesSendRequest):
    """和项目chat助手聊天."""
    raise HTTPException(status_code=501, detail="Project helper chat not implemented")
