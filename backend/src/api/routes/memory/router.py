from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.memory.schema import (
    MemoryCreateRequest,
    MemoryDetailResponse,
    MemoryMetaResponse,
    MemoryUpdateRequest,
)
from infrastructure.pg.pg_client import get_session
from services.memory.service import MemoryService

# 根据文档要求，路径应为 /plugin/memory
router = APIRouter(prefix="/plugin/memory", tags=["memories"])

def get_memory_service(session: AsyncSession = Depends(get_session)) -> MemoryService:
    return MemoryService(session)

@router.get("", response_model=Response[List[MemoryMetaResponse]])
async def get_memory_list(
    service: MemoryService = Depends(get_memory_service)
) -> Response[List[MemoryMetaResponse]]:
    """获取记忆列表."""
    data = await service.get_memory_list()
    return Response.ok(data=data)

@router.get("/{memory_id}", response_model=Response[MemoryDetailResponse])
async def get_memory_detail(
    memory_id: str,
    service: MemoryService = Depends(get_memory_service)
) -> Response[MemoryDetailResponse]:
    """获取记忆详情."""
    data = await service.get_memory_detail(memory_id)
    return Response.ok(data=data)

@router.post("", response_model=Response[MemoryMetaResponse])
async def create_memory(
    request: MemoryCreateRequest,
    service: MemoryService = Depends(get_memory_service)
) -> Response[MemoryMetaResponse]:
    """创建记忆."""
    data = await service.create_memory(request)
    return Response.ok(data=data)

@router.patch("/{memory_id}", response_model=Response[None])
async def update_memory(
    memory_id: str,
    request: MemoryUpdateRequest,
    service: MemoryService = Depends(get_memory_service)
) -> Response[None]:
    """更新记忆."""
    await service.update_memory(memory_id, request)
    return Response.ok()

@router.delete("/{memory_id}", response_model=Response[None])
async def delete_memory(
    memory_id: str,
    service: MemoryService = Depends(get_memory_service)
) -> Response[None]:
    """删除记忆."""
    await service.delete_memory(memory_id)
    return Response.ok()
