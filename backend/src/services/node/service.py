import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from api.routes.node.schema import (
    CreateNodeDTO,
    NodeDetailResponse,
    UpdateNodeDTO,
)
from common.errors import ResourceNotFoundError
from common.utils import get_now_time
from infrastructure.pg.pg_models import (
    DocumentVersionSQLEntity,
    NodeRelationshipSQLEntity,
    NodeSQLEntity,
)


class NodeService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_node(self, work_id: str, request: CreateNodeDTO) -> NodeDetailResponse:
        """创建节点（文档/文件夹）."""
        logger.info(f"[CreateNode] Starting for work_id={work_id}, type={request.node_type}, name={request.node_name}")

        # 1. 创建节点
        new_node = NodeSQLEntity(
            work_id=work_id,
            name=request.node_name,
            node_type=request.node_type,
            description=request.description
        )
        self.session.add(new_node)
        await self.session.flush() # Get ID
        logger.info(f"[CreateNode] Node created. ID={new_node.id}")

        # 2. 如果是文档，创建初始版本
        content = ""
        word_count = 0
        if request.node_type == "document":
            logger.info(f"[CreateNode] Creating initial version for document node {new_node.id}")
            version = DocumentVersionSQLEntity(
                node_id=new_node.id,
                version_number=1,
                content=content,
                word_count=word_count,
                create_time=get_now_time()
            )
            self.session.add(version)
            logger.info(f"[CreateNode] Initial version added to session for node {new_node.id}")
        else:
            logger.info(f"[CreateNode] Node type is {request.node_type}, skipping version creation")

        # 3. 处理关系 (Parent -> Child)
        # 使用 NodeRelationship 维护层级结构
        if request.fater_node_id:
             # Parent(from) -> Child(to), type="parent"
             # 这里约定: from_node_id 是父节点, to_node_id 是子节点
            rel = NodeRelationshipSQLEntity(
                work_id=work_id,
                from_node_id=request.fater_node_id.hex,
                to_node_id=new_node.id,
                relation_type="parent"
            )
            self.session.add(rel)
        
        await self.session.commit()
        await self.session.refresh(new_node)

        return NodeDetailResponse(
            node_id=new_node.id,
            node_name=new_node.name,
            content=content,
            node_type=new_node.node_type, # type: ignore
            word_count=word_count,
            description=new_node.description,
            fater_node_id=request.fater_node_id # Return the parent_id from request as it's just created
        )

    async def get_node_detail(self, node_id: str) -> NodeDetailResponse:
        """获取节点详情."""
        stmt = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        
        if not node:
            raise ResourceNotFoundError(f"Node not found: {node_id}")

        content = ""
        word_count = 0
        
        if node.node_type == "document":
            # 获取最新版本
            stmt_ver = select(DocumentVersionSQLEntity)\
                .where(DocumentVersionSQLEntity.node_id == node_id)\
                .order_by(DocumentVersionSQLEntity.version_number.desc())\
                .limit(1)
            result_ver = await self.session.execute(stmt_ver)
            latest_version = result_ver.scalar_one_or_none()
            
            if latest_version:
                content = latest_version.content
                word_count = latest_version.word_count
        
        # 获取父节点ID
        stmt_parent = select(NodeRelationshipSQLEntity.from_node_id)\
            .where(NodeRelationshipSQLEntity.to_node_id == node_id)\
            .where(NodeRelationshipSQLEntity.relation_type == "parent")
        result_parent = await self.session.execute(stmt_parent)
        parent_id = result_parent.scalar_one_or_none()

        return NodeDetailResponse(
            node_id=node.id,
            node_name=node.name,
            content=content,
            node_type=node.node_type, # type: ignore
            word_count=word_count,
            description=node.description,
            fater_node_id=parent_id
        )

    async def update_node(self, node_id: str, request: UpdateNodeDTO) -> NodeDetailResponse:
        """更新节点（重命名/移动/内容更新）."""
        stmt = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        
        if not node:
            raise ResourceNotFoundError(f"Node not found: {node_id}")
            
        # Update Meta
        if request.node_name is not None:
            node.name = request.node_name
            
        if request.description is not None:
            node.description = request.description
        
        if request.fater_node_id is not None:
            # TODO: Validate parent_id exists and no cycle
            # Update Relationship
            # 1. Remove old parent relationship
            stmt_del_rel = select(NodeRelationshipSQLEntity)\
                .where(NodeRelationshipSQLEntity.to_node_id == node_id)\
                .where(NodeRelationshipSQLEntity.relation_type == "parent")
            result_del_rel = await self.session.execute(stmt_del_rel)
            old_rel = result_del_rel.scalars().all()
            for r in old_rel:
                await self.session.delete(r)
            
            # 2. Add new parent relationship
            new_rel = NodeRelationshipSQLEntity(
                work_id=node.work_id,
                from_node_id=request.fater_node_id.hex,
                to_node_id=node.id,
                relation_type="parent"
            )
            self.session.add(new_rel)
            
        # Update Content (New Version)
        content = ""
        word_count = 0
        if request.content is not None and node.node_type == "document":
            # Get latest version number
            stmt_ver = select(func.max(DocumentVersionSQLEntity.version_number))\
                .where(DocumentVersionSQLEntity.node_id == node_id)
            result_ver = await self.session.execute(stmt_ver)
            max_ver = result_ver.scalar() or 0
            
            new_ver = max_ver + 1
            content = request.content
            word_count = len(content) # Simple count
            
            version = DocumentVersionSQLEntity(
                node_id=node.id,
                version_number=new_ver,
                content=content,
                word_count=word_count,
                create_time=get_now_time()
            )
            self.session.add(version)
        elif node.node_type == "document":
             # Fetch existing content for response
            stmt_ver = select(DocumentVersionSQLEntity)\
                .where(DocumentVersionSQLEntity.node_id == node_id)\
                .order_by(DocumentVersionSQLEntity.version_number.desc())\
                .limit(1)
            result_ver = await self.session.execute(stmt_ver)
            latest_version = result_ver.scalar_one_or_none()
            if latest_version:
                content = latest_version.content
                word_count = latest_version.word_count

        node.update_time = get_now_time()
        await self.session.commit()
        await self.session.refresh(node)
        
        # 获取父节点ID (For response)
        current_parent_id = None
        stmt_parent = select(NodeRelationshipSQLEntity.from_node_id)\
            .where(NodeRelationshipSQLEntity.to_node_id == node_id)\
            .where(NodeRelationshipSQLEntity.relation_type == "parent")
        result_parent = await self.session.execute(stmt_parent)
        current_parent_id = result_parent.scalar_one_or_none()
        
        return NodeDetailResponse(
            node_id=node.id,
            node_name=node.name,
            content=content,
            node_type=node.node_type, # type: ignore
            word_count=word_count,
            description=node.description,
            fater_node_id=current_parent_id
        )

    async def delete_node(self, node_id: str) -> None:
        """删除节点."""
        stmt = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        
        if not node:
            raise ResourceNotFoundError(f"Node not found: {node_id}")
            
        # Manually delete relationships if not CASCADE
        # Delete Parent Relationship (Where this node is child)
        stmt_del_child = select(NodeRelationshipSQLEntity).where(NodeRelationshipSQLEntity.to_node_id == node_id)
        res_del_child = await self.session.execute(stmt_del_child)
        for r in res_del_child.scalars().all():
            await self.session.delete(r)
            
        # Delete Children Relationship (Where this node is parent)
        # Note: This orphans children. Ideally should delete children or move them.
        # Simple implementation: Delete relationships where I am parent.
        stmt_del_parent = select(NodeRelationshipSQLEntity).where(NodeRelationshipSQLEntity.from_node_id == node_id)
        res_del_parent = await self.session.execute(stmt_del_parent)
        for r in res_del_parent.scalars().all():
            await self.session.delete(r)

        # Delete Document Versions (If document)
        stmt_del_ver = select(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.node_id == node_id)
        res_del_ver = await self.session.execute(stmt_del_ver)
        for v in res_del_ver.scalars().all():
            await self.session.delete(v)
        
        await self.session.delete(node)
        await self.session.commit()
