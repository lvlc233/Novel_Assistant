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
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_memory_list(self) -> List[MemoryMetaResponse]:
        """获取记忆列表."""
        stmt = select(MemorySQLEntity)
        result = await self.session.execute(stmt)
        memories = result.scalars().all()
        
        return [
            MemoryMetaResponse(
                memory_id=UUID(memory.id),
                enable=True, # 数据库中暂无 enabled 字段，默认 True
                memory_name=memory.name,
                memory_description=memory.description,
                create_at=memory.create_time
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
            memory_id=UUID(memory.id),
            enable=True,
            memory_name=memory.name,
            memory_type=memory.memory_type,
            memory_description=memory.description,
            create_at=memory.create_time,
            memory_content=memory.context
        )

    async def create_memory(self, request: MemoryCreateRequest) -> MemoryMetaResponse:
        """创建记忆."""
        memory = MemorySQLEntity(
            id=create_uuid(),
            name=request.memory_name,
            memory_type=request.memory_type,
            description=request.memory_description,
            context=request.memory_context or "",
            create_time=get_now_time()
        )
        
        self.session.add(memory)
        await self.session.commit()
        await self.session.refresh(memory)
        
        return MemoryMetaResponse(
            memory_id=UUID(memory.id),
            enable=True,
            memory_name=memory.name,
            memory_description=memory.description,
            create_at=memory.create_time
        )

    async def update_memory(self, memory_id: str, request: MemoryUpdateRequest) -> None:
        """更新记忆."""
        stmt = select(MemorySQLEntity).where(MemorySQLEntity.id == memory_id)
        result = await self.session.execute(stmt)
        memory = result.scalar_one_or_none()
        
        if not memory:
            raise ResourceNotFoundError(f"Memory with id {memory_id} not found")
            
        if request.memory_name is not None:
            memory.name = request.memory_name
        if request.memory_description is not None:
            memory.description = request.memory_description
        if request.memory_context is not None:
            memory.context = request.memory_context
            
        # Note: enabled field is not in DB yet, ignoring request.enable for now
            
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
