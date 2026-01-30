from typing import List
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.kd.schema import (
    KDCreateRequest,
    KDDescriptionCreateRequest,
    KDDescriptionResponse,
    KDDescriptionUpdateRequest,
    KDMetaResponse,
    KDUpdateRequest,
)
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import KnowledgeBaseSQLEntity, KnowledgeChunkSQLEntity


class KDService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_kd_list(self) -> List[KDMetaResponse]:
        """获取知识库列表"""
        stmt = select(KnowledgeBaseSQLEntity).order_by(KnowledgeBaseSQLEntity.create_time.desc())
        result = await self.session.execute(stmt)
        entities = result.scalars().all()
        
        return [
            KDMetaResponse(
                id=UUID(entity.id),
                enabled=True,
                titel=entity.name,
                description=entity.description,
                create_at=entity.create_time
            )
            for entity in entities
        ]

    async def create_kd(self, request: KDCreateRequest) -> KDMetaResponse:
        """知识库构建"""
        entity = KnowledgeBaseSQLEntity(
            name=request.name,
            description=request.description,
            work_id=None # Default to global as per new spec ignoring work_id
        )
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KDMetaResponse(
            id=UUID(entity.id),
            enabled=True,
            titel=entity.name,
            description=entity.description,
            create_at=entity.create_time
        )

    async def get_kd_detail(self, kd_id: str) -> List[KDDescriptionResponse]:
        """获取知识库详情(知识点) - 返回 chunks 列表"""
        # Verify KB exists
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError(f"Knowledge Base {kd_id} not found")

        # Fetch chunks
        stmt_chunks = select(KnowledgeChunkSQLEntity).where(KnowledgeChunkSQLEntity.kb_id == kd_id)
        result_chunks = await self.session.execute(stmt_chunks)
        chunks = result_chunks.scalars().all()
        
        return [
            KDDescriptionResponse(
                chunk_id=UUID(c.id),
                enabled=True,
                search_keys=[], # TODO: Add search_keys to DB model if needed, currently empty
                context=c.content,
                create_at=c.create_time if hasattr(c, 'create_time') else None, # Assuming create_time exists or handled
                update_at=None
            )
            for c in chunks
        ]

    async def update_kd(self, kd_id: str, request: KDUpdateRequest) -> None:
        """知识库元数据修改"""
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"Knowledge Base {kd_id} not found")
            
        entity.name = request.name
        if request.description is not None:
            entity.description = request.description
            
        # Ignoring enabled for now as it's not in DB
            
        await self.session.commit()

    async def delete_kd(self, kd_id: str) -> None:
        """知识库删除"""
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError("Knowledge Base not found")
            
        # Delete chunks first
        await self.session.execute(delete(KnowledgeChunkSQLEntity).where(KnowledgeChunkSQLEntity.kb_id == kd_id))
        await self.session.delete(entity)
        await self.session.commit()

    async def create_kd_chunk(self, kd_id: str, request: KDDescriptionCreateRequest) -> KDDescriptionResponse:
        """知识库(知识点创建)"""
        # Verify KB exists
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError("Knowledge Base not found")

        entity = KnowledgeChunkSQLEntity(
            id=str(request.chunk_id),
            kb_id=kd_id,
            content=request.context or ""
        )
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KDDescriptionResponse(
            chunk_id=UUID(entity.id),
            enabled=True,
            search_keys=request.search_keys,
            context=entity.content,
            create_at=None,
            update_at=None
        )

    async def update_kd_chunk(self, kd_id: str, chunk_id: str, request: KDDescriptionUpdateRequest) -> None:
        """知识库(知识点修改)"""
        stmt = select(KnowledgeChunkSQLEntity).where(
            KnowledgeChunkSQLEntity.id == chunk_id,
            KnowledgeChunkSQLEntity.kb_id == kd_id
        )
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"Chunk {chunk_id} not found in KB {kd_id}")
            
        if request.context is not None:
            entity.content = request.context
            
        await self.session.commit()

    async def delete_kd_chunk(self, kd_id: str, chunk_id: str) -> None:
        """知识库(知识点删除)"""
        stmt = select(KnowledgeChunkSQLEntity).where(
            KnowledgeChunkSQLEntity.id == chunk_id,
            KnowledgeChunkSQLEntity.kb_id == kd_id
        )
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError("Chunk not found")
            
        await self.session.delete(entity)
        await self.session.commit()
