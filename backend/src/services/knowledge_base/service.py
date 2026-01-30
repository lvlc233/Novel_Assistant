from typing import List

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.knowledge_base.schema import (
    CreateKnowledgeBaseRequest,
    CreateKnowledgeChunkRequest,
    KnowledgeBaseChunkResponse,
    KnowledgeBaseDetailResponse,
    KnowledgeBaseResponse,
    UpdateKnowledgeBaseRequest,
    UpdateKnowledgeChunkRequest,
)
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import KnowledgeBaseSQLEntity, KnowledgeChunkSQLEntity


class KnowledgeBaseService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_knowledge_base_list(self) -> List[KnowledgeBaseResponse]:
        stmt = select(KnowledgeBaseSQLEntity).order_by(KnowledgeBaseSQLEntity.create_time.desc())
        result = await self.session.execute(stmt)
        entities = result.scalars().all()
        
        return [
            KnowledgeBaseResponse(
                id=entity.id,
                name=entity.name,
                description=entity.description,
                tags=[], # Not in DB yet
                created_at=entity.create_time,
                updated_at=entity.create_time # Use create_time as update_time for now
            )
            for entity in entities
        ]

    async def create_knowledge_base(self, request: CreateKnowledgeBaseRequest) -> KnowledgeBaseResponse:
        entity = KnowledgeBaseSQLEntity(
            name=request.name,
            description=request.description,
            work_id=request.work_id
        )
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KnowledgeBaseResponse(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            tags=[],
            created_at=entity.create_time,
            updated_at=entity.create_time
        )

    async def get_knowledge_base_detail(self, kb_id: str) -> KnowledgeBaseDetailResponse:
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kb_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError("Knowledge Base not found")
            
        # Fetch chunks
        stmt_chunks = select(KnowledgeChunkSQLEntity).where(KnowledgeChunkSQLEntity.kb_id == kb_id)
        result_chunks = await self.session.execute(stmt_chunks)
        chunks = result_chunks.scalars().all()
        
        chunk_responses = [
            KnowledgeBaseChunkResponse(
                id=c.id,
                kb_id=c.kb_id,
                content=c.content,
                title=c.content[:20] + "..." if len(c.content) > 20 else c.content, # Use content snippet as title
                tags=[],
                created_at=None,
                updated_at=None
            )
            for c in chunks
        ]
        
        return KnowledgeBaseDetailResponse(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            tags=[],
            created_at=entity.create_time,
            updated_at=entity.create_time,
            chunks=chunk_responses
        )

    async def update_knowledge_base(self, kb_id: str, request: UpdateKnowledgeBaseRequest) -> KnowledgeBaseResponse:
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kb_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError("Knowledge Base not found")
            
        if request.name is not None:
            entity.name = request.name
        if request.description is not None:
            entity.description = request.description
            
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KnowledgeBaseResponse(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            tags=[],
            created_at=entity.create_time,
            updated_at=entity.create_time
        )

    async def delete_knowledge_base(self, kb_id: str) -> None:
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kb_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError("Knowledge Base not found")
            
        # Delete chunks first (cascade usually handles this but good to be explicit or if cascade not set)
        await self.session.execute(delete(KnowledgeChunkSQLEntity).where(KnowledgeChunkSQLEntity.kb_id == kb_id))
        await self.session.delete(entity)
        await self.session.commit()

    async def create_chunk(self, kb_id: str, request: CreateKnowledgeChunkRequest) -> KnowledgeBaseChunkResponse:
        # Verify KB exists
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kb_id)
        result = await self.session.execute(stmt)
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError("Knowledge Base not found")

        entity = KnowledgeChunkSQLEntity(
            kb_id=kb_id,
            content=request.content
        )
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KnowledgeBaseChunkResponse(
            id=entity.id,
            kb_id=entity.kb_id,
            content=entity.content,
            title=request.title, # Pass through request title even if not saved
            tags=request.tags,
            created_at=None,
            updated_at=None
        )

    async def update_chunk(self, kb_id: str, chunk_id: str, request: UpdateKnowledgeChunkRequest) -> None:
        stmt = select(KnowledgeChunkSQLEntity).where(
            KnowledgeChunkSQLEntity.id == chunk_id,
            KnowledgeChunkSQLEntity.kb_id == kb_id
        )
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError("Chunk not found")
            
        if request.content is not None:
            entity.content = request.content
            
        await self.session.commit()

    async def delete_chunk(self, kb_id: str, chunk_id: str) -> None:
        stmt = select(KnowledgeChunkSQLEntity).where(
            KnowledgeChunkSQLEntity.id == chunk_id,
            KnowledgeChunkSQLEntity.kb_id == kb_id
        )
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError("Chunk not found")
            
        await self.session.delete(entity)
        await self.session.commit()
