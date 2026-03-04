from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from common.enums import MemoryTypeEnum, PluginFromTypeEnum
from common.errors import ResourceNotFoundError
from common.utils.utils import create_uuid, get_now_time
from infrastructure.pg.pg_models import MemorySQLEntity
from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject
from infrastructure.pg.pg_client import get_session

class MemoryMetaResponse(BaseModel):
    id: UUID
    enabled: bool
    name: str
    description: str | None = None
    create_at: datetime

class MemoryDetailResponse(BaseModel):
    id: UUID
    enabled: bool
    name: str
    type: str
    description: str | None = None
    create_at: datetime
    context: str | None = None

class MemoryCreateRequest(BaseModel):
    name: str
    type: str
    description: str | None = None
    context: str | None = None

class MemoryUpdateRequest(BaseModel):
    enabled: bool | None = None
    name: str | None = None
    description: str | None = None
    context: str | None = None

@plugin_meta(
    name="memory",
    space="official",
    version="0.0.1",
    description="记忆管理插件",
    from_type=PluginFromTypeEnum.OFFICIAL,
    tags=["memory"]
)
class MemoryPlugin:

    @runtime_config
    def __init__(self, session: AsyncSession = Inject(get_session)):
        self.session = session

    @operation(name="get_memory_list")
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

    @operation(name="get_memory_detail")
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

    @operation(name="create_memory")
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

    @operation(name="update_memory")
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
