from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.work.schema import (
    CreateWorkRequest,
    UpdateWorkPluginRequest,
    WorkDetailResponse,
    WorkMetaResponse,
    WorkMetaUpdateRequest,
    WorkPluginDetailResponse,
    WorkPluginMetaResponse,
)
from infrastructure.pg.pg_client import get_session
from services.work.service import WorkService

router = APIRouter(prefix="/work", tags=["works"])

def get_work_service(session: AsyncSession = Depends(get_session)) -> WorkService:
    return WorkService(session)

@router.post("", response_model=Response[WorkMetaResponse])
async def create_work(
    request: CreateWorkRequest,
    service: WorkService = Depends(get_work_service)
) -> Response[WorkMetaResponse]:
    """创建作品."""
    data = await service.create_work(request)
    return Response.ok(data=data)

@router.get("", response_model=Response[List[WorkMetaResponse]])
async def get_work_list(
    service: WorkService = Depends(get_work_service)
) -> Response[List[WorkMetaResponse]]:
    """获取作品列表."""
    data = await service.get_work_list()
    return Response.ok(data=data)

@router.get("/{work_id}", response_model=Response[WorkDetailResponse])
async def get_work_detail(
    work_id: str,
    service: WorkService = Depends(get_work_service)
) -> Response[WorkDetailResponse]:
    """获取作品详情."""
    data = await service.get_work_detail(work_id)
    return Response.ok(data=data)

@router.patch("/{work_id}", response_model=Response[None])
async def update_work_meta(
    work_id: str,
    request: WorkMetaUpdateRequest,
    service: WorkService = Depends(get_work_service)
) -> Response[None]:
    """更新作品元数据."""
    await service.update_work_meta(work_id, request)
    return Response.ok()

@router.get("/{work_id}/plugins", response_model=Response[List[WorkPluginMetaResponse]])
async def list_work_plugins(
    work_id: str,
    service: WorkService = Depends(get_work_service)
) -> Response[List[WorkPluginMetaResponse]]:
    """获取作品插件列表."""
    data = await service.list_work_plugins(work_id)
    return Response.ok(data=data)

@router.get("/{work_id}/plugins/{plugin_id}", response_model=Response[WorkPluginDetailResponse])
async def get_work_plugin_detail(
    work_id: str,
    plugin_id: UUID,
    service: WorkService = Depends(get_work_service)
) -> Response[WorkPluginDetailResponse]:
    """获取作品插件详情."""
    data = await service.get_work_plugin_detail(work_id, plugin_id)
    return Response.ok(data=data)

@router.put("/{work_id}/plugins/{plugin_id}", response_model=Response[None])
async def update_work_plugin(
    work_id: str,
    plugin_id: UUID,
    request: UpdateWorkPluginRequest, # body contains enabled, config
    service: WorkService = Depends(get_work_service)
) -> Response[None]:
    """更新作品插件状态/配置."""
    # Ensure path param matches body or override
    request.plugin_id = plugin_id
    await service.update_work_plugin(work_id, request)
    return Response.ok()

@router.delete("/{work_id}", response_model=Response[None])
async def delete_work(
    work_id: str,
    service: WorkService = Depends(get_work_service)
) -> Response[None]:
    """删除作品."""
    await service.delete_work(work_id)
    return Response.ok()
