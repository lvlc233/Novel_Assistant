from typing import List
# from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.work.schema import (
    CreateWorkRequest,
    WorkDetailResponse,
    WorkMetaResponse,
    WorkMetaUpdateRequest,
    # UpdateWorkPluginRequest,
    # WorkPluginDetailResponse,
    # WorkPluginMetaResponse,
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


@router.patch("/{work_id}", response_model=Response[None])
async def update_work_meta(
    work_id: str,
    request: WorkMetaUpdateRequest,
    service: WorkService = Depends(get_work_service)
) -> Response[None]:
    """更新作品元数据."""
    await service.update_work_meta(work_id, request)
    return Response.ok()

@router.delete("/{work_id}", response_model=Response[None])
async def delete_work(
    work_id: str,
    service: WorkService = Depends(get_work_service)
) -> Response[None]:
    """删除作品."""
    await service.delete_work(work_id)
    return Response.ok()

@router.get("/{work_id}", response_model=Response[WorkDetailResponse])
async def get_work_detail(
    work_id: str,
    service: WorkService = Depends(get_work_service)
) -> Response[WorkDetailResponse]:
    """获取作品详情."""
    data = await service.get_work_detail(work_id)
    return Response.ok(data=data)
    
# 开发者: BackendAgent(python)
# 当前版本: BE-DEP-20260224-03
# 创建时间: 2026-02-24 00:22
# 更新时间: 2026-02-24 00:22
# 更新记录:
#     [2026-02-24 00:22:BE-DEP-20260224-03: 注释掉未使用的作品插件接口，避免误调用。]
# 注释者: BackendAgent(python)
# 时间: 2026-02-24 00:22
# 使用位置: 后端路由 /work/{work_id}/plugin 相关接口 (前端未调用)
# 实现概述: 注释掉作品插件列表、详情、更新与启用接口，保留作品基础增删改查。
# 废弃标记: 已废弃
# @router.get("/{work_id}/plugin", response_model=Response[List[WorkPluginMetaResponse]])
# async def list_work_plugins(
#     work_id: str,
#     service: WorkService = Depends(get_work_service)
# ) -> Response[List[WorkPluginMetaResponse]]:
#     """获取作品插件列表."""
#     data = await service.list_work_plugins(work_id)
#     return Response.ok(data=data)
#
# @router.get("/{work_id}/plugin/{plugin_id}", response_model=Response[WorkPluginDetailResponse])
# async def get_work_plugin_detail(
#     work_id: str,
#     plugin_id: UUID,
#     service: WorkService = Depends(get_work_service)
# ) -> Response[WorkPluginDetailResponse]:
#     """获取作品插件详情."""
#     data = await service.get_work_plugin_detail(work_id, plugin_id)
#     return Response.ok(data=data)
#
# @router.patch("/{work_id}/plugin/{plugin_id}", response_model=Response[None])
# async def update_work_plugin(
#     work_id: str,
#     plugin_id: UUID,
#     request: UpdateWorkPluginRequest, # body contains enabled, config
#     service: WorkService = Depends(get_work_service)
# ) -> Response[None]:
#     """更新作品插件状态/配置."""
#     await service.update_work_plugin(work_id, plugin_id, request)
#     return Response.ok()
#
# @router.patch("/{work_id}/plugin/{plugin_id}/enabled", response_model=Response[None])
# async def update_work_plugin_enabled(
#     work_id: str,
#     plugin_id: UUID,
#     enabled: bool,
#     service: WorkService = Depends(get_work_service)
# ) -> Response[None]:
#     """更新作品插件启动状态."""
#     request = UpdateWorkPluginRequest(enabled=enabled, config=None)
#     request.plugin_id = plugin_id
#     await service.update_work_plugin(work_id, request)
#     return Response.ok()

