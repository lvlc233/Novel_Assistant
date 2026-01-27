from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.plugin.schema import PluginMetaResponse, PluginResponse, PluginUpdateRequest
from services.plugin.service import PluginService
from infrastructure.pg.pg_client import get_session

router = APIRouter(prefix="/plugins", tags=["plugins"])

def get_plugin_service(session: AsyncSession = Depends(get_session)) -> PluginService:
    return PluginService(session)

@router.get("", response_model=Response[List[PluginMetaResponse]])
async def get_plugin_list(
    service: PluginService = Depends(get_plugin_service)
) -> Response[List[PluginMetaResponse]]:
    """获取所有插件列表"""
    data = await service.get_plugin_list()
    return Response.ok(data=data)

@router.get("/{plugin_id}", response_model=Response[PluginResponse])
async def get_plugin_detail(
    plugin_id: UUID,
    service: PluginService = Depends(get_plugin_service)
) -> Response[PluginResponse]:
    """获取插件详情"""
    data = await service.get_plugin_detail(plugin_id)
    return Response.ok(data=data)

@router.patch("/{plugin_id}", response_model=Response[None])
async def update_plugin(
    plugin_id: UUID,
    request: PluginUpdateRequest,
    service: PluginService = Depends(get_plugin_service)
) -> Response[None]:
    """更新插件配置"""
    await service.update_plugin(plugin_id, request)
    return Response.ok()

# TODO: 暂时不需要卸载的接口,如果要卸载也是自定义的或以后的事情了
# @router.delete("/{plugin_id}", response_model=Response[None])
# async def uninstall_plugin(
#     plugin_id: UUID,
#     service: PluginService = Depends(get_plugin_service)
# ) -> Response[None]:
#     """卸载插件"""
#     await service.delete_plugin(plugin_id)
#     return Response.ok()
