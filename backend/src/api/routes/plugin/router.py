from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.plugin.schema import (
    PluginMetaResponse,
    PluginResponse,
    PluginUpdateRequest,
    StandardDataResponse
)
from backend.src.core.plugin.manager import PluginManager
from infrastructure.pg.pg_client import get_session
from services.plugin.service import PluginService
from api.dependencies import get_plugin_manager

router = APIRouter(prefix="/plugin", tags=["plugins"])

def get_plugin_service(session: AsyncSession = Depends(get_session)) -> PluginService:
    return PluginService(session)

@router.get("", response_model=Response[List[PluginMetaResponse]])
async def get_plugin_list(
    service: PluginService = Depends(get_plugin_service)
) -> Response[List[PluginMetaResponse]]:
    """获取所有插件列表."""
    data = await service.get_plugin_list()
    return Response.ok(data=data)

@router.get("/system", response_model=Response[List[PluginResponse]])
async def get_system_plugins(
    service: PluginService = Depends(get_plugin_service)
) -> Response[List[PluginResponse]]:
    """获取系统插件列表 (SYSTEM)."""
    data = await service.get_system_plugins()
    return Response.ok(data=data)

@router.get("/expand", response_model=Response[List[PluginMetaResponse]])
async def get_expand_plugins(
    service: PluginService = Depends(get_plugin_service)
) -> Response[List[PluginMetaResponse]]:
    """获取扩展插件列表 (OFFICIAL, CUSTOM)."""
    data = await service.get_expand_plugins()
    return Response.ok(data=data)

@router.get("/proxy/{plugin_id}/data", response_model=Response[StandardDataResponse])
async def proxy_plugin_data(
    plugin_id: UUID,
    request: Request,
    plugin_manager: PluginManager = Depends(get_plugin_manager)
) -> Response[StandardDataResponse]:
    """BFF Proxy for plugin data."""
    # Capture all query params
    params = dict(request.query_params)
    
    # 使用插件管理器获取实例并执行
    instance = await plugin_manager.get_instance(plugin_id)
    if not instance:
        return Response.fail("找不到插件")
    
    data = await instance.execute(params)
    return Response.ok(data=data)

@router.get("/{plugin_id}", response_model=Response[PluginResponse])
async def get_plugin_detail(
    plugin_id: UUID,
    service: PluginService = Depends(get_plugin_service)
) -> Response[PluginResponse]:
    """获取插件详情."""
    data = await service.get_plugin_detail(plugin_id)
    return Response.ok(data=data)

@router.patch("/{plugin_id}", response_model=Response[None])
async def update_plugin(
    plugin_id: UUID,
    request: PluginUpdateRequest,
    service: PluginService = Depends(get_plugin_service)
) -> Response[None]:
    """更新插件配置."""
    await service.update_plugin(plugin_id, request)
    return Response.ok()
