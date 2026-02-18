from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.dependencies import get_internal_plugin_registry
from api.routes.plugin.schema import (
    InternalPluginResponse,
    PluginMetaResponse,
    PluginResponse,
    PluginShopMetaResponse,
    PluginUpdateRequest
)
from core.plugin.base.models import PluginDefinition
from core.plugin.runtime import PluginInternalRegistry, PluginManager
from infrastructure.pg.pg_client import get_session
from infrastructure.pg.pg_models import PluginSQLEntity
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

def _to_meta_response(plugin_def: PluginDefinition, enabled: bool) -> PluginMetaResponse:
    return PluginMetaResponse(
        id=plugin_def["id"],
        name=plugin_def["name"],
        version=plugin_def.get("version", "1.0.0"),
        description=plugin_def.get("description"),
        enabled=enabled,    
    )

def _to_shop_meta_response(
    plugin_def: PluginDefinition,
    installed_plugin: PluginSQLEntity | None
) -> PluginShopMetaResponse:
    latest_version = plugin_def.get("version", "1.0.0")
    installed_version = installed_plugin.version if installed_plugin else None
    installed = installed_plugin is not None
    return PluginShopMetaResponse(
        id=plugin_def["id"],
        name=plugin_def["name"],
        version=latest_version,
        description=plugin_def.get("description"),
        enabled=installed_plugin.enabled if installed_plugin else False,
        render_type=plugin_def["render_type"],
        installed=installed,
        installed_version=installed_version,
        latest_version=latest_version,
        upgrade_available=installed and installed_version != latest_version
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

@router.post("/internal/{plugin_id}/unregister", response_model=Response[UUID])
async def unregister_internal_plugin(
    plugin_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> Response[UUID]:
    manager = PluginManager(session)
    removed = await manager.remove_plugin(plugin_id)
    if not removed:
        return Response.fail(code=40400, message=f"插件不存在: {plugin_id}")
    return Response.ok(data=plugin_id)

@router.get("/shop", response_model=Response[List[PluginShopMetaResponse]])
async def get_shop_plugins(
    # service: PluginService = Depends(get_plugin_service)
    registry: PluginInternalRegistry = Depends(get_internal_plugin_registry),
    session: AsyncSession = Depends(get_session),
) -> Response[List[PluginShopMetaResponse]]:
    """
    获取商店插件列表 (OFFICIAL).
    对接商店内部注册器, 从注册器中获取插件列表.并转化为插件元数据列表.提供前端进行选择.
    """
    registry_plugins = registry.get_plugin_list()
    plugin_ids = [plugin_def["id"] for plugin_def in registry_plugins]
    installed_map = {}
    if plugin_ids:
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id.in_(plugin_ids))
        result = await session.execute(stmt)
        installed_plugins = result.scalars().all()
        installed_map = {plugin.id: plugin for plugin in installed_plugins}
    data = [
        _to_shop_meta_response(plugin_def, installed_map.get(plugin_def["id"]))
        for plugin_def in registry_plugins
    ]
    return Response.ok(data=data)

@router.post("/shop/{plugin_id}/register", response_model=Response[UUID])
async def register_shop_plugin(
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

@router.post("/shop/{plugin_id}/unregister", response_model=Response[UUID])
async def unregister_shop_plugin(
    plugin_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> Response[UUID]:
    manager = PluginManager(session)
    removed = await manager.remove_plugin(plugin_id)
    if not removed:
        return Response.fail(code=40400, message=f"插件不存在: {plugin_id}")
    return Response.ok(data=plugin_id)

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
