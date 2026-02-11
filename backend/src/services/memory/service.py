"""Memory Service Module."""
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.memory.schema import (
    MemoryCreateRequest,
    MemoryDetailResponse,
    MemoryMetaResponse,
    MemoryUpdateRequest,
)
from common.errors import ResourceNotFoundError
from common.utils import create_uuid, get_now_time
from infrastructure.pg.pg_models import MemorySQLEntity


class MemoryService:
    """记忆服务类."""
    def __init__(self, session: AsyncSession):
        """Initialize MemoryService."""
        self.session = session

    async def get_memory_list(self) -> List[MemoryMetaResponse]:
        """获取记忆列表."""
        stmt = select(MemorySQLEntity)
        result = await self.session.execute(stmt)
        memories = result.scalars().all()
        
        return [
            MemoryMetaResponse(
                id=memory.id,
                enabled=memory.enabled,
                name=memory.name,
                description=memory.description,
                create_at=memory.create_at
            ) for memory in memories
        ]

    async def get_memory_detail(self, memory_id: str) -> MemoryDetailResponse:
        """获取记忆详情."""
        stmt = select(MemorySQLEntity).where(MemorySQLEntity.id == memory_id)
        result = await self.session.execute(stmt)
        memory = result.scalar_one_or_none()
        
        if not memory:
            raise ResourceNotFoundError(f"Memory with id {memory_id} not found")
            
        return MemoryDetailResponse(
            id=memory.id,
            enabled=memory.enabled,
            name=memory.name,
            type=memory.type,
            description=memory.description,
            create_at=memory.create_at,
            context=memory.context
        )

    async def create_memory(self, request: MemoryCreateRequest) -> MemoryMetaResponse:
        """创建记忆."""
        memory = MemorySQLEntity(
            id=create_uuid(),
            name=request.name,
            type=request.type,
            description=request.description,
            context=request.context or "",
            create_at=get_now_time()
        )
        
        self.session.add(memory)
        await self.session.commit()
        await self.session.refresh(memory)
        
        return MemoryMetaResponse(
            id=memory.id,
            enabled=memory.enabled,
            name=memory.name,
            description=memory.description,
            create_at=memory.create_at
        )

    async def update_memory(self, memory_id: str, request: MemoryUpdateRequest) -> None:
        """更新记忆."""
        stmt = select(MemorySQLEntity).where(MemorySQLEntity.id == memory_id)
        result = await self.session.execute(stmt)
        memory = result.scalar_one_or_none()
        
        if not memory:
            raise ResourceNotFoundError(f"Memory with id {memory_id} not found")
            
        if request.name is not None:
            memory.name = request.name
        if request.description is not None:
            memory.description = request.description
        if request.context is not None:
            memory.context = request.context
        if request.enabled is not None:
            memory.enabled = request.enabled
            
        await self.session.commit()

    async def delete_memory(self, memory_id: str) -> None:
        """删除记忆."""
        stmt = select(MemorySQLEntity).where(MemorySQLEntity.id == memory_id)
        result = await self.session.execute(stmt)
        memory = result.scalar_one_or_none()
        
        if not memory:
            raise ResourceNotFoundError(f"Memory with id {memory_id} not found")
            
        await self.session.delete(memory)
        await self.session.commit()
