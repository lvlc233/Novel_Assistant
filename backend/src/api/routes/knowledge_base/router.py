from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.knowledge_base.schema import (
    CreateKnowledgeBaseRequest,
    CreateKnowledgeChunkRequest,
    KnowledgeBaseChunkResponse,
    KnowledgeBaseDetailResponse,
    KnowledgeBaseResponse,
    UpdateKnowledgeBaseRequest,
    UpdateKnowledgeChunkRequest,
)
from infrastructure.pg.pg_client import get_session
from services.knowledge_base.service import KnowledgeBaseService

router = APIRouter(prefix="/plugin/kd", tags=["knowledge-bases"])

def get_kb_service(session: AsyncSession = Depends(get_session)) -> KnowledgeBaseService:
    return KnowledgeBaseService(session)

@router.get("", response_model=Response[List[KnowledgeBaseResponse]])
async def get_knowledge_base_list(
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[List[KnowledgeBaseResponse]]:
    """Get Knowledge Base List."""
    data = await service.get_knowledge_base_list()
    return Response.ok(data=data)

@router.post("", response_model=Response[KnowledgeBaseResponse])
async def create_knowledge_base(
    request: CreateKnowledgeBaseRequest,
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[KnowledgeBaseResponse]:
    """Create Knowledge Base."""
    data = await service.create_knowledge_base(request)
    return Response.ok(data=data)

@router.get("/{kb_id}", response_model=Response[KnowledgeBaseDetailResponse])
async def get_knowledge_base_detail(
    kb_id: str,
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[KnowledgeBaseDetailResponse]:
    """Get Knowledge Base Detail."""
    data = await service.get_knowledge_base_detail(kb_id)
    return Response.ok(data=data)

@router.patch("/{kb_id}", response_model=Response[KnowledgeBaseResponse])
async def update_knowledge_base(
    kb_id: str,
    request: UpdateKnowledgeBaseRequest,
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[KnowledgeBaseResponse]:
    """Update Knowledge Base."""
    data = await service.update_knowledge_base(kb_id, request)
    return Response.ok(data=data)

@router.delete("/{kb_id}", response_model=Response[None])
async def delete_knowledge_base(
    kb_id: str,
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[None]:
    """Delete Knowledge Base."""
    await service.delete_knowledge_base(kb_id)
    return Response.ok()

# Chunk Routes

@router.post("/{kb_id}/chunks", response_model=Response[KnowledgeBaseChunkResponse])
async def create_chunk(
    kb_id: str,
    request: CreateKnowledgeChunkRequest,
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[KnowledgeBaseChunkResponse]:
    """Create Chunk."""
    data = await service.create_chunk(kb_id, request)
    return Response.ok(data=data)

@router.patch("/{kb_id}/chunks/{chunk_id}", response_model=Response[None])
async def update_chunk(
    kb_id: str,
    chunk_id: str,
    request: UpdateKnowledgeChunkRequest,
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[None]:
    """Update Chunk."""
    await service.update_chunk(kb_id, chunk_id, request)
    return Response.ok()

@router.delete("/{kb_id}/chunks/{chunk_id}", response_model=Response[None])
async def delete_chunk(
    kb_id: str,
    chunk_id: str,
    service: KnowledgeBaseService = Depends(get_kb_service)
) -> Response[None]:
    """Delete Chunk."""
    await service.delete_chunk(kb_id, chunk_id)
    return Response.ok()
