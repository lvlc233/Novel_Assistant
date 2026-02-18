from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.dependencies import get_internal_plugin_registry
from api.routes.plugin.schema import (
    InternalPluginResponse,
    PluginMetaResponse,
    PluginResponse,
    PluginUpdateRequest
)
from core.plugin.base.models import PluginDefinition
from core.plugin.runtime import PluginInternalRegistry, PluginManager
from infrastructure.pg.pg_client import get_session
from services.plugin.service import PluginService

router = APIRouter(prefix="/plugin", tags=["plugins"])

def get_plugin_service(session: AsyncSession = Depends(get_session)) -> PluginService:
    return PluginService(session)

def _to_internal_response(plugin_def: PluginDefinition) -> InternalPluginResponse:
    return InternalPluginResponse(
        id=plugin_def["id"],
        name=plugin_def["name"],
        version=plugin_def.get("version", "1.0.0"),
        description=plugin_def.get("description"),
        from_type=plugin_def["from_type"],
        scope_type=plugin_def["scope_type"],
        loader_type=plugin_def["loader_type"],
        render_type=plugin_def["render_type"],
        tags=plugin_def.get("tags", []),
        config_schema=plugin_def.get("config_schema", {}),
        plugin_operation_schema=plugin_def.get("plugin_operation_schema", {}),
    )

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

@router.get("/internal", response_model=Response[List[InternalPluginResponse]])
async def get_internal_plugins(
    registry: PluginInternalRegistry = Depends(get_internal_plugin_registry),
) -> Response[List[InternalPluginResponse]]:
    data = [_to_internal_response(plugin_def) for plugin_def in registry.get_plugin_list()]
    return Response.ok(data=data)

@router.post("/internal/{plugin_id}/register", response_model=Response[UUID])
async def register_internal_plugin(
    plugin_id: UUID,
    registry: PluginInternalRegistry = Depends(get_internal_plugin_registry),
    session: AsyncSession = Depends(get_session),
) -> Response[UUID]:
    plugin_def = next(
        (item for item in registry.get_plugin_list() if item["id"] == plugin_id),
        None,
    )
    if plugin_def is None:
        return Response.fail(code=40400, message=f"插件不存在: {plugin_id}")
    manager = PluginManager(session)
    registered_id = await manager.add_plugin_with_register(plugin_def)
    return Response.ok(data=registered_id)

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
