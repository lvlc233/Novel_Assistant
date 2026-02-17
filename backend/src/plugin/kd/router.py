from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.kd.schema import (
    KDCreateRequest,
    KDDescriptionCreateRequest,
    KDDescriptionResponse,
    KDDescriptionUpdateRequest,
    KDMetaResponse,
    KDUpdateRequest,
)
from infrastructure.pg.pg_client import get_session
from services.kd.service import KDService

router = APIRouter(prefix="/plugin/kd", tags=["knowledge-bases"])

def get_kd_service(session: AsyncSession = Depends(get_session)) -> KDService:
    return KDService(session)

@router.get("", response_model=Response[List[KDMetaResponse]])
async def get_kd_list(
    service: KDService = Depends(get_kd_service)
) -> Response[List[KDMetaResponse]]:
    """获取知识库列表."""
    data = await service.get_kd_list()
    return Response.ok(data=data)

@router.get("/{id}", response_model=Response[List[KDDescriptionResponse]])
async def get_kd_detail(
    id: str,
    service: KDService = Depends(get_kd_service)
) -> Response[List[KDDescriptionResponse]]:
    """获取知识库详情(知识点)."""
    data = await service.get_kd_detail(id)
    return Response.ok(data=data)

@router.post("", response_model=Response[KDMetaResponse])
async def create_kd(
    request: KDCreateRequest,
    service: KDService = Depends(get_kd_service)
) -> Response[KDMetaResponse]:
    """知识库构建."""
    data = await service.create_kd(request)
    return Response.ok(data=data)

@router.post("/{id}", response_model=Response[KDDescriptionResponse])
async def create_kd_chunk(
    id: str,
    request: KDDescriptionCreateRequest,
    service: KDService = Depends(get_kd_service)
) -> Response[KDDescriptionResponse]:
    """知识库(知识点创建)."""
    data = await service.create_kd_chunk(id, request)
    return Response.ok(data=data)

@router.delete("/{id}", response_model=Response[None])
async def delete_kd(
    id: str,
    service: KDService = Depends(get_kd_service)
) -> Response[None]:
    """知识库删除."""
    await service.delete_kd(id)
    return Response.ok()

@router.delete("/{id}/{chunk_id}", response_model=Response[None])
async def delete_kd_chunk(
    id: str,
    chunk_id: str,
    service: KDService = Depends(get_kd_service)
) -> Response[None]:
    """知识库(知识点删除)."""
    await service.delete_kd_chunk(id, chunk_id)
    return Response.ok()

@router.patch("/{id}", response_model=Response[None])
async def update_kd(
    id: str,
    request: KDUpdateRequest,
    service: KDService = Depends(get_kd_service)
) -> Response[None]:
    """知识库元数据修改."""
    await service.update_kd(id, request)
    return Response.ok()

@router.patch("/{id}/{chunk_id}", response_model=Response[None])
async def update_kd_chunk(
    id: str,
    chunk_id: str,
    request: KDDescriptionUpdateRequest,
    service: KDService = Depends(get_kd_service)
) -> Response[None]:
    """知识库(知识点修改)."""
    await service.update_kd_chunk(id, chunk_id, request)
    return Response.ok()
