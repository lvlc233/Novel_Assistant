
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import KnowledgeBaseSQLEntity, KnowledgeChunkSQLEntity
from plugin.kd.schema import KDCreateRequest, KDDescriptionCreateRequest, KDDescriptionResponse, KDDescriptionUpdateRequest, KDMetaResponse, KDUpdateRequest
from core.plugin.annotations import plugin_meta, runtime_config, operation
from common.enums import PluginFromTypeEnum, UITrigger
from sqlalchemy import delete, select, or_, and_
from sqlalchemy import desc
from core.ui.home import Home
from core.plugin.di import Inject
from infrastructure.pg.pg_client import get_session

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
    def __init__(self, session: AsyncSession = Inject(get_session)):
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
            stmt = select(KnowledgeBaseSQLEntity).order_by(desc(KnowledgeBaseSQLEntity.create_at))
            result = await self.session.execute(stmt)
            entities = result.scalars().all()
            
            return [
                KDMetaResponse(
                    id=entity.id,
                    enabled=entity.enabled,
                    title=entity.title,
                    description=entity.description,
                    create_at=entity.create_at
                )
                for entity in entities
            ]

    @operation
    async def create_kd(self, request: KDCreateRequest) -> KDMetaResponse:
        """知识库构建."""
        if isinstance(request, dict):
            request = KDCreateRequest(**request)
            
        entity = KnowledgeBaseSQLEntity(
            title=request.title,
            description=request.description,
            work_id=request.work_id
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
                chunk_id=c.id,
                enabled=c.enabled,
                search_keys=c.search_keys,
                content=c.content,
                create_at=c.create_at,
                update_at=c.update_at
            )
            for c in chunks
        ]

    @operation
    async def update_kd(self, kd_id: str, request: KDUpdateRequest) -> None:
        """知识库元数据修改."""
        if isinstance(request, dict):
            request = KDUpdateRequest(**request)
            
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"找不到知识库: {kd_id}")
            
        entity.title = request.title
        if request.description is not None:
            entity.description = request.description
            
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
            
        await self.session.execute(delete(KnowledgeChunkSQLEntity).where(KnowledgeChunkSQLEntity.kb_id == kd_id))
        await self.session.delete(entity)
        await self.session.commit()

    @operation
    async def create_kd_chunk(self, kd_id: str, request: KDDescriptionCreateRequest) -> KDDescriptionResponse:
        """知识库(知识点创建)."""
        if isinstance(request, dict):
            request = KDDescriptionCreateRequest(**request)
            
        # Verify KB exists
        stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.id == kd_id)
        result = await self.session.execute(stmt)
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError(f"找不到知识库: {kd_id}")

        entity = KnowledgeChunkSQLEntity(
            id=request.chunk_id,
            kb_id=kd_id,
            content=request.content or "",
            search_keys=request.search_keys
        )
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        
        return KDDescriptionResponse(
            chunk_id=entity.id,
            enabled=entity.enabled,
            search_keys=entity.search_keys,
            content=entity.content,
            create_at=entity.create_at,
            update_at=entity.update_at
        )

    @operation
    async def update_kd_chunk(self, kd_id: str, chunk_id: str, request: KDDescriptionUpdateRequest) -> None:
        """知识库(知识点修改)."""
        if isinstance(request, dict):
            request = KDDescriptionUpdateRequest(**request)
            
        stmt = select(KnowledgeChunkSQLEntity).where(
            KnowledgeChunkSQLEntity.id == chunk_id,
            KnowledgeChunkSQLEntity.kb_id == kd_id
        )
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"找不到知识点: {chunk_id}")
            
        if request.content is not None:
            entity.content = request.content
            
        if request.search_keys is not None:
            entity.search_keys = request.search_keys
            
        entity.enabled = request.enabled
            
        await self.session.commit()

    @operation
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

    @operation(name="search_kd")
    async def search_kd(self, work_id: str, query: str) -> List[KDDescriptionResponse]:
        """基于关键词搜索知识点 (Agent专属工具)"""
        # 先找到作品关联的所有知识库
        kb_stmt = select(KnowledgeBaseSQLEntity).where(KnowledgeBaseSQLEntity.work_id == work_id)
        kb_results = await self.session.execute(kb_stmt)
        kb_ids = [kb.id for kb in kb_results.scalars().all()]
        
        if not kb_ids:
            return []
            
        # 在这些知识库中搜索含有关键词的 chunk
        chunk_stmt = select(KnowledgeChunkSQLEntity).where(
            and_(
                KnowledgeChunkSQLEntity.kb_id.in_(kb_ids),
                KnowledgeChunkSQLEntity.enabled == True,
                or_(
                    KnowledgeChunkSQLEntity.content.like(f"%{query}%")
                )
            )
        )
        # 补充: 如果 search_keys 搜索逻辑较复杂，可以用 postgres 的 JSONB 操作，
        # 但这里为了通用性先简单点
        
        chunk_results = await self.session.execute(chunk_stmt)
        chunks = chunk_results.scalars().all()
        
        return [
            KDDescriptionResponse(
                chunk_id=c.id,
                enabled=c.enabled,
                search_keys=c.search_keys,
                content=c.content,
                create_at=c.create_at,
                update_at=c.update_at
            ) for c in chunks
        ]
