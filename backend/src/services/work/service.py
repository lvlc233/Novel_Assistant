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
from common.enums import NovelState, NovelStateCN, PluginScopeType
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
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_work(self, request: CreateWorkRequest) -> WorkMetaResponse:
        """创建作品."""
        # 1. 创建 Work 实体
        new_work = WorkSQLEntity(
            name=request.works_name or "未命名作品",
            cover_image_url=request.works_cover_image_url,
            summary=request.works_summary,
            work_type=request.works_type
        )
        self.session.add(new_work)
        await self.session.flush() # 获取 ID

        # 2. 处理插件关联
        if request.enabled_plugin_id_list:
            # 验证插件是否存在
            stmt = select(PluginSQLEntity).where(PluginSQLEntity.id.in_([str(pid) for pid in request.enabled_plugin_id_list]))
            result = await self.session.execute(stmt)
            plugins = result.scalars().all()
            found_ids = {p.id for p in plugins}
            # TODO: 插件有3个等级,全局状态不可以在作品中配置(启动或禁用,也无法配置),在创建的时候只能配置作品级/文档级的插件,不过这里就放着吧这里。
            for pid in request.enabled_plugin_id_list:
                if str(pid) not in found_ids:
                    # 可以在这里报错，或者忽略
                    # raise PluginNotFoundError(str(pid))
                    continue
                
                mapping = WorkPluginMappingSQLEntity(
                    work_id=new_work.id,
                    plugin_id=str(pid),
                    enabled=True,
                    config={} # 默认空配置，使用插件默认配置
                )
                self.session.add(mapping)

        await self.session.commit()
        await self.session.refresh(new_work)

        return WorkMetaResponse(
            work_meta=WorkMetaDTO(
                work_id=new_work.id,
                work_cover_image_url=new_work.cover_image_url,
                work_name=new_work.name,
                work_summary=new_work.summary,
                work_state=NovelStateCN.COMPLETED if new_work.state == NovelState.COMPLETED.value else NovelStateCN.UPDATING,
                work_type=new_work.work_type,
                created_time=new_work.create_time,
                updated_time=new_work.update_time
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
        stmt = select(WorkSQLEntity).order_by(WorkSQLEntity.update_time.desc())
        result = await self.session.execute(stmt)
        works = result.scalars().all()
        return [WorkMetaResponse(work_meta=self._to_meta_dto(w)) for w in works]

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

        # Build Parent Map from Edges for Nodes DTO
        parent_map = {}
        for e in edges:
            if e.relation_type == "parent":
                parent_map[e.to_node_id] = e.from_node_id

        return WorkDetailResponse(
            works_meta=self._to_meta_dto(work),
            works_document=[
                NodeDTO(
                    node_id=n.id,
                    node_name=n.name,
                    node_type=n.node_type, # type: ignore
                    description=n.description,
                    parent_id=parent_map.get(n.id),
                    sort_order=0 # n.sort_order removed from DB
                ) for n in nodes
            ],
            works_documents_relationship=[
                EdgeDTO(
                    from_nodes=[e.from_node_id],
                    to_nodes=[e.to_node_id]
                ) for e in edges
            ]
        )
    
    async def update_work_meta(self, work_id: str, request: WorkMetaUpdateRequest) -> None:
        """更新作品元数据."""
        stmt = select(WorkSQLEntity).where(WorkSQLEntity.id == work_id)
        result = await self.session.execute(stmt)
        work = result.scalar_one_or_none()
        
        if not work:
            raise ResourceNotFoundError(f"Work not found: {work_id}")
            
        if request.works_name is not None:
            work.name = request.works_name
        if request.works_cover_image_url is not None:
            work.cover_image_url = request.works_cover_image_url
        if request.works_summary is not None:
            work.summary = request.works_summary
        if request.works_state is not None:
            work.state = NovelState.COMPLETED.value if request.works_state == NovelStateCN.COMPLETED else NovelState.UPDATING.value
            
        work.update_time = get_now_time()
        await self.session.commit()

    def _to_meta_dto(self, work: WorkSQLEntity) -> WorkMetaDTO:
        return WorkMetaDTO(
            work_id=work.id,
            work_cover_image_url=work.cover_image_url,
            work_name=work.name,
            work_summary=work.summary,
            work_state=NovelStateCN.COMPLETED if work.state == NovelState.COMPLETED.value else NovelStateCN.UPDATING,
            work_type=work.work_type,
            created_time=work.create_time,
            updated_time=work.update_time
        )

    async def list_work_plugins(self, work_id: str) -> List[WorkPluginMetaResponse]:
        """获取作品插件列表(包含所有可用插件(作品级和文档级别的插件)，标明启用状态)."""
        stmt = select(PluginSQLEntity, WorkPluginMappingSQLEntity)\
            .outerjoin(
                WorkPluginMappingSQLEntity, 
                and_(
                    PluginSQLEntity.id == WorkPluginMappingSQLEntity.plugin_id, 
                    WorkPluginMappingSQLEntity.work_id == work_id
                )
            )\
            .where(PluginSQLEntity.scope_type.in_([PluginScopeType.WORK.value, PluginScopeType.DOCUMENT.value]))
        
        result: Result[Tuple[PluginSQLEntity, WorkPluginMappingSQLEntity | None]] = await self.session.execute(stmt)
        rows: Sequence[Row[Tuple[PluginSQLEntity, WorkPluginMappingSQLEntity | None]]] = result.all()
        
        return [
            WorkPluginMetaResponse(
                plugin_id=plugin.id,
                name=plugin.name,
                enabled=mapping.enabled if mapping else False,
                description=plugin.description
            ) for plugin, mapping in rows
        ]

    async def get_work_plugin_detail(self, work_id: str, plugin_id: UUID) -> WorkPluginDetailResponse:
        """获取作品插件详情(包含所有可用插件(作品级和文档级别的插件)，标明启用状态)."""
        stmt = select(WorkPluginMappingSQLEntity, PluginSQLEntity)\
            .join(PluginSQLEntity, WorkPluginMappingSQLEntity.plugin_id == PluginSQLEntity.id)\
            .where(WorkPluginMappingSQLEntity.work_id == work_id)\
            .where(WorkPluginMappingSQLEntity.plugin_id == str(plugin_id))\
            .where(PluginSQLEntity.scope_type.in_([PluginScopeType.WORK.value, PluginScopeType.DOCUMENT.value]))
            
        result: Result[Tuple[WorkPluginMappingSQLEntity, PluginSQLEntity]] = await self.session.execute(stmt)
        row: Row[Tuple[WorkPluginMappingSQLEntity, PluginSQLEntity]] | None = result.first()
        
        if not row:
            # 检查插件是否存在，如果存在但未关联，可能需要处理（当前假设必须先关联）
            # 或者如果插件存在但没 mapping，是否返回默认？
            # 架构文档 implying mapping creation on work creation. 
            # If not mapped, treat as not enabled or not found?
            # 简单起见，如果找不到mapping，尝试找plugin，如果plugin存在，则返回默认配置且enabled=False (virtual mapping)
            # 但create_work只关联了enabled_plugin_id_list。
            # 如果要支持后期启用插件，应该在这里支持 "lazy loading" 或者 list_work_plugins 应该返回所有可用插件？
            # Doc says "get all plugins for a work".
            # For now, raise Not Found if not mapped.
            raise ResourceNotFoundError(f"Plugin {plugin_id} not enabled or found for work {work_id}")
            
        mapping, plugin = row
        
        # 合并配置：Default Config updated by Mapping Config
        merged_config = plugin.default_config.copy()
        if mapping.config:
            merged_config.update(mapping.config)
            
        return WorkPluginDetailResponse(
            plugin_id=plugin.id,
            name=plugin.name,
            description=plugin.description,
            enabled=mapping.enabled,
            config=merged_config,
            from_type=plugin.from_type, # type: ignore
            scope_type=plugin.scope_type, # type: ignore
            tags=plugin.tags
        )

    async def update_work_plugin(self, work_id: str, request: UpdateWorkPluginRequest) -> None:
        """更新作品插件状态/配置."""
        # Check existence
        plugin_id_str = request.plugin_id.hex
        stmt = select(WorkPluginMappingSQLEntity).where(
            WorkPluginMappingSQLEntity.work_id == work_id,
            WorkPluginMappingSQLEntity.plugin_id == plugin_id_str
        )
        result = await self.session.execute(stmt)
        mapping = result.scalar_one_or_none()
        
        if not mapping:
             # 如果不存在映射，可能需要创建（如果插件存在）
             # 检查插件是否存在
            plugin_stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id_str)
            plugin_res = await self.session.execute(plugin_stmt)
            if not plugin_res.scalar_one_or_none():
                 raise PluginNotFoundError(plugin_id_str)
            
            # 创建新映射
            mapping = WorkPluginMappingSQLEntity(
                work_id=work_id,
                plugin_id=plugin_id_str,
                enabled=request.enabled,
                config=request.config
            )
            self.session.add(mapping)
        else:
            mapping.enabled = request.enabled
            mapping.config = request.config
            
        await self.session.commit()

