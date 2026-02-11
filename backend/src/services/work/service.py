"""Work Service Module."""
from typing import List, Sequence, Tuple
from uuid import UUID

from sqlalchemy import and_, delete, select
from sqlalchemy.engine import Result, Row
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.work.schema import (
    CreateWorkRequest,
    EdgeDTO,
    NodeDTO,
    UpdateWorkPluginRequest,
    WorkDetailResponse,
    WorkMetaDTO,
    WorkMetaResponse,
    WorkMetaUpdateRequest,
    WorkPluginDetailResponse,
    WorkPluginMetaResponse,
)
from common.enums import PluginScopeTypeEnum, WorkStateCNEnum, WorkStateEnum
from common.errors import PluginNotFoundError, ResourceNotFoundError
from common.utils import get_now_time
from infrastructure.pg.pg_models import (
    DocumentVersionSQLEntity,
    NodeRelationshipSQLEntity,
    NodeSQLEntity,
    PluginSQLEntity,
    WorkPluginMappingSQLEntity,
    WorkSQLEntity,
)


class WorkService:
    """作品服务类."""
    def __init__(self, session: AsyncSession):
        """Initialize WorkService."""
        self.session = session

    async def create_work(self, request: CreateWorkRequest) -> WorkMetaResponse:
        """创建作品."""
        # 1. 创建 Work 实体
        new_work = WorkSQLEntity(
            name=request.name or "未命名作品",
            cover_image_url=request.cover_image_url,
            summary=request.summary,
            work_type=request.type
        )
        self.session.add(new_work)
        await self.session.flush() # 获取 ID

        # 2. 处理插件关联
        if request.enabled_plugin_id_list:
            # 验证插件是否存在
            stmt = select(PluginSQLEntity).where(PluginSQLEntity.id.in_(request.enabled_plugin_id_list))
            result = await self.session.execute(stmt)
            plugins = result.scalars().all()
            found_ids = {p.id for p in plugins}
            # TODO: 插件有3个等级,全局状态不可以在作品中配置(启动或禁用,也无法配置),在创建的时候只能配置作品级/文档级的插件,不过这里就放着吧这里。
            for pid in request.enabled_plugin_id_list:
                if pid not in found_ids:
                    # 可以在这里报错，或者忽略
                    # raise PluginNotFoundError(str(pid))
                    continue
                
                mapping = WorkPluginMappingSQLEntity(
                    work_id=new_work.id,
                    plugin_id=pid,
                    enabled=True,
                    config={} # 默认空配置，使用插件默认配置
                )
                self.session.add(mapping)

        await self.session.commit()
        await self.session.refresh(new_work)

        return WorkMetaResponse(
            meta=WorkMetaDTO(
                id=new_work.id,
                cover_image_url=new_work.cover_image_url,
                name=new_work.name,
                summary=new_work.summary,
                state=WorkStateCNEnum.COMPLETED if new_work.state == WorkStateEnum.COMPLETED.value else WorkStateCNEnum.UPDATING,
                type=new_work.work_type,
                create_at=new_work.create_at,
                update_at=new_work.update_at
            )
        )

    async def delete_work(self, work_id: str) -> None:
        """删除作品."""
        stmt = select(WorkSQLEntity).where(WorkSQLEntity.id == work_id)
        result = await self.session.execute(stmt)
        work = result.scalar_one_or_none()
        
        if not work:
            raise ResourceNotFoundError(f"Work not found: {work_id}")

        
        # 1. 删除依赖的插件映射
        await self.session.execute(
            delete(WorkPluginMappingSQLEntity).where(WorkPluginMappingSQLEntity.work_id == work_id)
        )
        
        # 2. 删除依赖的节点关系
        await self.session.execute(
            delete(NodeRelationshipSQLEntity).where(NodeRelationshipSQLEntity.work_id == work_id)
        )
        
        # 3. 删除依赖的文档版本 (通过节点关联)
        nodes_subquery = select(NodeSQLEntity.id).where(NodeSQLEntity.work_id == work_id)
        await self.session.execute(
            delete(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.node_id.in_(nodes_subquery))
        )
        
        # 4. 删除依赖的节点
        await self.session.execute(
            delete(NodeSQLEntity).where(NodeSQLEntity.work_id == work_id)
        )
            
        # 6. Delete Work
        await self.session.delete(work)
        await self.session.commit()

    async def get_work_list(self) -> List[WorkMetaResponse]:
        """获取作品列表."""
        stmt = select(WorkSQLEntity).order_by(WorkSQLEntity.update_at.desc())
        result = await self.session.execute(stmt)
        works = result.scalars().all()
        return [WorkMetaResponse(meta=self._to_meta_dto(w)) for w in works]

    async def get_work_detail(self, work_id: str) -> WorkDetailResponse:
        """获取作品详情（含目录树和关系）."""
        stmt = select(WorkSQLEntity).where(WorkSQLEntity.id == work_id)
        result = await self.session.execute(stmt)
        work = result.scalar_one_or_none()
        
        if not work:
            raise ResourceNotFoundError(f"Work not found: {work_id}")

        # 获取 Nodes
        stmt_nodes = select(NodeSQLEntity).where(NodeSQLEntity.work_id == work_id)
        result_nodes = await self.session.execute(stmt_nodes)
        nodes = result_nodes.scalars().all()

        # 获取 Relationships
        stmt_edges = select(NodeRelationshipSQLEntity).where(NodeRelationshipSQLEntity.work_id == work_id)
        result_edges = await self.session.execute(stmt_edges)
        edges = result_edges.scalars().all()

        # Aggregate edges by from_node_id
        edge_map = {}
        for e in edges:
            if e.from_node_id not in edge_map:
                edge_map[e.from_node_id] = []
            edge_map[e.from_node_id].append(e.to_node_id)

        return WorkDetailResponse(
            meta=self._to_meta_dto(work),
            document=[
                NodeDTO(
                    id=n.id,
                    name=n.name,
                    type=n.node_type, # type: ignore
                    description=n.description,
                    now_version=n.now_version
                ) for n in nodes
            ],
            relationship=[
                EdgeDTO(
                    from_node_id=from_id,
                    to_node_ids=to_ids
                ) for from_id, to_ids in edge_map.items()
            ]
        )
    
    async def update_work_meta(self, work_id: str, request: WorkMetaUpdateRequest) -> None:
        """更新作品元数据."""
        stmt = select(WorkSQLEntity).where(WorkSQLEntity.id == work_id)
        result = await self.session.execute(stmt)
        work = result.scalar_one_or_none()
        
        if not work:
            raise ResourceNotFoundError(f"Work not found: {work_id}")
            
        if request.name is not None:
            work.name = request.name
        if request.cover_image_url is not None:
            work.cover_image_url = request.cover_image_url
        if request.summary is not None:
            work.summary = request.summary
        if request.state is not None:
            work.state = WorkStateEnum.COMPLETED if request.state == WorkStateCNEnum.COMPLETED else WorkStateEnum.UPDATING
            
        work.update_at = get_now_time()
        await self.session.commit()

    def _to_meta_dto(self, work: WorkSQLEntity) -> WorkMetaDTO:
        return WorkMetaDTO(
            id=work.id,
            cover_image_url=work.cover_image_url,
            name=work.name,
            summary=work.summary,
            state=WorkStateCNEnum.COMPLETED if work.state == WorkStateEnum.COMPLETED.value else WorkStateCNEnum.UPDATING,           
            type=work.work_type,
            create_at=work.create_at,
            update_at=work.update_at
        )

    async def get_work_plugins(self, work_id: str) -> List[WorkPluginMetaResponse]:
        """获取作品启用的插件列表 (包含配置)."""
        stmt = select(WorkPluginMappingSQLEntity).where(WorkPluginMappingSQLEntity.work_id == work_id)
        result = await self.session.execute(stmt)
        mappings = result.scalars().all()
        
        # 批量获取插件详情
        plugin_ids = [m.plugin_id for m in mappings]
        if not plugin_ids:
            return []
            
        stmt_p = select(PluginSQLEntity).where(PluginSQLEntity.id.in_(plugin_ids))
        result_p = await self.session.execute(stmt_p)
        plugins = result_p.scalars().all()
        plugins_map = {p.id: p for p in plugins}
        
        response = []
        for m in mappings:
            p = plugins_map.get(m.plugin_id)
            if p:
                response.append(WorkPluginMetaResponse(
                    plugin_id=p.id,
                    name=p.name,
                    enabled=m.enabled,
                    scope_type=p.scope_type,
                    tags=p.tags
                ))
        return response

    async def update_work_plugin_config(self, work_id: str, plugin_id: str, request: UpdateWorkPluginRequest) -> WorkPluginDetailResponse:
        """更新作品的插件配置."""
        stmt = select(WorkPluginMappingSQLEntity).where(
            and_(
                WorkPluginMappingSQLEntity.work_id == work_id,
                WorkPluginMappingSQLEntity.plugin_id == plugin_id
            )
        )
        result = await self.session.execute(stmt)
        mapping = result.scalar_one_or_none()
        
        if not mapping:
             # 如果没有映射，可能是尚未启用，或者插件不存在
             # 这里假设只能更新已关联的插件
             # 若要支持"配置即启用"，需要先查询 Plugin 表
             raise ResourceNotFoundError(f"Plugin mapping not found for work {work_id} and plugin {plugin_id}")

        if request.enabled is not None:
            mapping.enabled = request.enabled
            
        if request.config is not None:
            # Merge or Replace? Let's Replace for now
            mapping.config = request.config
            
        await self.session.commit()
        await self.session.refresh(mapping)
        
        # Get Plugin Detail for response
        stmt_p = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result_p = await self.session.execute(stmt_p)
        plugin = result_p.scalar_one_or_none()
        
        return WorkPluginDetailResponse(
            plugin_id=plugin.id,
            name=plugin.name,
            enabled=mapping.enabled,
            config=mapping.config,
            default_config=plugin.default_config,
            scope_type=plugin.scope_type,
            config_schema=plugin.config_schema
        )

    async def get_work_plugin_detail(self, work_id: str, plugin_id: str) -> WorkPluginDetailResponse:
        """获取作品插件详情."""
        stmt = select(WorkPluginMappingSQLEntity).where(
            and_(
                WorkPluginMappingSQLEntity.work_id == work_id,
                WorkPluginMappingSQLEntity.plugin_id == plugin_id
            )
        )
        result = await self.session.execute(stmt)
        mapping = result.scalar_one_or_none()
        
        if not mapping:
            # 尝试查找是否是默认启用的全局插件? 暂不处理，假设只有显式关联
             raise ResourceNotFoundError(f"Plugin mapping not found for work {work_id} and plugin {plugin_id}")
        
        stmt_p = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result_p = await self.session.execute(stmt_p)
        plugin = result_p.scalar_one_or_none()
        
        return WorkPluginDetailResponse(
            plugin_id=plugin.id,
            name=plugin.name,
            enabled=mapping.enabled,
            config=mapping.config,
            default_config=plugin.default_config,
            scope_type=plugin.scope_type,
            config_schema=plugin.config_schema
        )


