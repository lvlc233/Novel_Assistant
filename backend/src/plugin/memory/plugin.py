from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from common.enums import MemoryTypeEnum, PluginFromTypeEnum, UITrigger
from common.errors import ResourceNotFoundError
from common.utils.utils import create_uuid, get_now_time, load_chat_model_with_env
from infrastructure.pg.pg_models import MemorySQLEntity
from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject
from infrastructure.pg.pg_client import get_session
from core.ui.home import Home
from langchain_core.messages import SystemMessage, HumanMessage

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
    tags=["memory", "tool"]
)
class MemoryPlugin:

    @runtime_config
    def __init__(
        self, 
        session: AsyncSession = Inject(get_session),
        base_url: str = "",
        api_key: str = "",
        model_name: str = ""
    ):
        self.session = session
        self.base_url = base_url
        self.api_key = api_key
        self.model_name = model_name

    @operation(
        name="manage_memories",
        description="管理记忆 UI",
        ui_target=Home.PluginDetails.Info,
        with_ui=[Home.PluginExpand.PluginCard.filter(name="memory")],
        trigger=UITrigger.CLICK
    )
    async def manage_memories(self):
        """管理记忆 UI"""
        memories = await self.get_memory_list()
        return {
            "name": "memory",
            "data": {"memories": [m.model_dump() for m in memories]},
            "info_type": "MemoryManager"
        }

    @operation(name="auto_organize")
    async def auto_organize(self) -> str:
        """自动整理记忆"""
        stmt = select(MemorySQLEntity).where(MemorySQLEntity.enabled == True)
        result = await self.session.execute(stmt)
        memories = result.scalars().all()
        
        if not memories:
            return "No memories to organize."
            
        context_text = "\n".join([f"[{m.name}]: {m.context}" for m in memories])
        
        if not self.api_key or not self.model_name:
            raise ValueError("LLM Configuration (api_key, model_name) is missing. Please configure it in the plugin settings.")
            
        from langchain_openai import ChatOpenAI
        model = ChatOpenAI(
            base_url=self.base_url if self.base_url else None,
            api_key=self.api_key,
            model=self.model_name
        )
        
        response = await model.ainvoke([
            SystemMessage(content="You are a memory manager. Summarize the following memory contexts into a single cohesive summary."),
            HumanMessage(content=context_text)
        ])
        
        summary = response.content if hasattr(response, "content") else str(response)
        
        # Create summary memory
        new_memory = MemorySQLEntity(
            id=create_uuid(),
            name=f"Summary {get_now_time().strftime('%Y-%m-%d')}",
            type=MemoryTypeEnum.LONG_TERM.value,
            description="Auto-generated summary",
            context=summary,
            create_at=get_now_time()
        )
        self.session.add(new_memory)
        await self.session.commit()
        
        return summary

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
        if isinstance(request, dict):
            request = MemoryCreateRequest(**request)
            
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
        if isinstance(request, dict):
            request = MemoryUpdateRequest(**request)
            
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

    @operation(name="delete_memory")
    async def delete_memory(self, memory_id: str) -> None:
        """删除记忆."""
        stmt = select(MemorySQLEntity).where(MemorySQLEntity.id == memory_id)
        result = await self.session.execute(stmt)
        memory = result.scalar_one_or_none()
        
        if not memory:
            raise ResourceNotFoundError(f"Memory with id {memory_id} not found")
            
        await self.session.delete(memory)
        await self.session.commit()
