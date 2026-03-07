
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import KnowledgeBaseSQLEntity, KnowledgeChunkSQLEntity
from plugin.kd.schema import KDCreateRequest, KDDescriptionCreateRequest, KDDescriptionResponse, KDDescriptionUpdateRequest, KDMetaResponse, KDUpdateRequest
from core.plugin.annotations import plugin_meta, runtime_config, operation
from common.enums import PluginFromTypeEnum, UITrigger
from sqlalchemy import delete, select
from sqlalchemy import desc
from core.ui.home import Home

@plugin_meta(
    name="kd",
    space="official", 
    version="0.0.1",
    description="知识库插件",
    from_type=PluginFromTypeEnum.OFFICIAL,
    tags=["tool"]
)
class KDPlugin:
    
    @runtime_config
    def __init__(self, session: AsyncSession):
        self.session = session

    @operation(
        name="manage_knowledge_bases",
        description="管理知识库 UI",
        ui_target=Home.PluginDetails.Info,
        with_ui=[Home.PluginExpand.PluginCard.filter(name="kd")],
        trigger=UITrigger.CLICK
    )
    async def manage_knowledge_bases(self):
        """管理知识库 UI"""
        kbs = await self.get_kd_list()
        return {
            "name": "kd",
            "data": {"kbs": [k.model_dump() for k in kbs]},
            "info_type": "KnowledgeBaseManager"
        }

    @operation
    async def get_kd_list(self) -> List[KDMetaResponse]:
            """获取知识库列表."""
            # Fix: use create_at instead of create_time
            stmt = select(KnowledgeBaseSQLEntity).order_by(desc(KnowledgeBaseSQLEntity.create_at))
            result = await self.session.execute(stmt)
            entities = result.scalars().all()
            
            return [
                KDMetaResponse(
                    id=entity.id, # Fix: entity.id is already UUID
                    enabled=entity.enabled, # Fix: use entity.enabled
                    title=entity.title, # Fix: use entity.title
                    description=entity.description,
                    create_at=entity.create_at # Fix: use entity.create_at
                )
                for entity in entities
            ]
    @operation
    async def create_kd(self, request: KDCreateRequest) -> KDMetaResponse:
        """知识库构建."""
        entity = KnowledgeBaseSQLEntity(
            title=request.title, # Fix: use title instead of name
            description=request.description,
            work_id=request.work_id # Use work_id from request
        )
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KDMetaResponse(
            id=entity.id,
            enabled=entity.enabled,
            title=entity.title,
            description=entity.description,
            create_at=entity.create_at
        )

    # 这个是要标注为工具的,给Agent使用
    @operation
    async def get_kd_detail(self, kd_id: str) -> List[KDDescriptionResponse]:
        """获取知识库详情(知识点) - 返回 chunks 列表."""
        # Verify KB exists
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError(f"找不到知识库: {kd_id}")

        # Fetch chunks
        stmt_chunks = select(KnowledgeChunkSQLEntity).where(KnowledgeChunkSQLEntity.kb_id == kd_id)
        result_chunks = await self.session.execute(stmt_chunks)
        chunks = result_chunks.scalars().all()
        
        return [
            KDDescriptionResponse(
                chunk_id=c.id, # Fix: id is UUID
                enabled=c.enabled,
                search_keys=c.search_keys, # Fix: use c.search_keys
                context=c.content,
                create_at=c.create_at, # Fix: use create_at
                update_at=c.update_at
            )
            for c in chunks
        ]
    @operation
    async def update_kd(self, kd_id: str, request: KDUpdateRequest) -> None:
        """知识库元数据修改."""
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"找不到知识库: {kd_id}")
            
        entity.title = request.title # Fix: use title
        if request.description is not None:
            entity.description = request.description
            
        # Update enabled status if needed (schema has enabled in KDUpdateRequest)
        entity.enabled = request.enabled
            
        await self.session.commit()

    @operation
    async def delete_kd(self, kd_id: str) -> None:
        """知识库删除."""
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"找不到知识库: {kd_id}")
            
        # Delete chunks first
        await self.session.execute(delete(KnowledgeChunkSQLEntity).where(KnowledgeChunkSQLEntity.kb_id == kd_id))
        await self.session.delete(entity)
        await self.session.commit()

    @operation
    async def create_kd_chunk(self, kd_id: str, request: KDDescriptionCreateRequest) -> KDDescriptionResponse:
        """知识库(知识点创建)."""
        # Verify KB exists
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError(f"找不到知识库: {kd_id}")

        entity = KnowledgeChunkSQLEntity(
            id=request.chunk_id, # Fix: Assuming request.chunk_id is UUID or str compatible
            kb_id=kd_id,
            content=request.context or "",
            search_keys=request.search_keys # Add search_keys
        )
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KDDescriptionResponse(
            chunk_id=entity.id,
            enabled=entity.enabled,
            search_keys=entity.search_keys,
            context=entity.content,
            create_at=entity.create_at,
            update_at=entity.update_at
        )

    @operation
    async def update_kd_chunk(self, kd_id: str, chunk_id: str, request: KDDescriptionUpdateRequest) -> None:
        """知识库(知识点修改)."""
        stmt = select(KnowledgeChunkSQLEntity).where(
            KnowledgeChunkSQLEntity.id == chunk_id,
            KnowledgeChunkSQLEntity.kb_id == kd_id
        )
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"找不到知识点: {chunk_id}")
            
        if request.context is not None:
            entity.content = request.context
            
        if request.search_keys is not None:
            entity.search_keys = request.search_keys
            
        entity.enabled = request.enabled
            
        await self.session.commit()

    async def delete_kd_chunk(self, kd_id: str, chunk_id: str) -> None:
        """知识库(知识点删除)."""
        stmt = select(KnowledgeChunkSQLEntity).where(
            KnowledgeChunkSQLEntity.id == chunk_id,
            KnowledgeChunkSQLEntity.kb_id == kd_id
        )
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"找不到知识点: {chunk_id}")
            
        await self.session.delete(entity)
        await self.session.commit()
