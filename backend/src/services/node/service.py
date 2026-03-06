"""Node Service Module."""
import logging
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.node.schema import (
    CreateNodeDTO,
    NodeDetailResponse,
    UpdateNodeDTO,
    DocumentVersionCreateRequest,
    DocumentVersionResponse,
    DocumentVersionItem,
    DocumentDetailResponse
)
from common.enums import NodeTypeEnum
from common.errors import ResourceNotFoundError
from common.utils.utils import get_now_time
from infrastructure.pg.pg_models import (
    DocumentVersionSQLEntity,
    NodeRelationshipSQLEntity,
    NodeSQLEntity,
)

logger = logging.getLogger(__name__)


class NodeService:
    """节点服务类."""
    def __init__(self, session: AsyncSession):
        """Initialize NodeService."""
        self.session = session

    async def create_node(self, work_id: str, request: CreateNodeDTO) -> NodeDetailResponse:
        """创建节点（文档/文件夹）."""
        logger.info(f"[CreateNode] Starting for work_id={work_id}, type={request.type}, name={request.name}")

        # 1. 创建节点
        new_node = NodeSQLEntity(
            work_id=work_id,
            name=request.name,
            node_type=request.type.value,
            description=request.description
        )
        self.session.add(new_node)
        await self.session.flush() # Get ID
        logger.info(f"[CreateNode] Node created. ID={new_node.id}")

        # 2. 如果是文档，创建初始版本
        content = ""
        word_count = 0
        if request.type == NodeTypeEnum.DOCUMENT:
            logger.info(f"[CreateNode] Creating initial version for document node {new_node.id}")
            version = DocumentVersionSQLEntity(
                node_id=new_node.id,
                version="初始化版本",
                full_text=content,
                word_count=word_count,
                create_at=get_now_time()
            )
            self.session.add(version)
            await self.session.flush() # Get version ID
            new_node.now_version = version.version
            logger.info(f"[CreateNode] Initial version {version.version} added to session for node {new_node.id}")
        else:
            logger.info(f"[CreateNode] Node type is {request.type}, skipping version creation")

        # 3. 处理关系 (Parent -> Child)
        # 使用 NodeRelationship 维护层级结构
        if request.parent_node_id:
             # Parent(from) -> Child(to)
             # 这里约定: from_node_id 是父节点, to_node_id 是子节点
            rel = NodeRelationshipSQLEntity(
                work_id=work_id,
                from_node_id=request.parent_node_id.hex,
                to_node_id=new_node.id
            )
            self.session.add(rel)
        
        await self.session.commit()
        await self.session.refresh(new_node)

        return NodeDetailResponse(
            id=new_node.id,
            name=new_node.name,
            content=content,
            type=NodeTypeEnum(new_node.node_type),
            word_count=word_count,
            description=new_node.description,
            parent_node_id=request.parent_node_id, # Return the parent_id from request as it's just created
            now_version=None # Initial version created but not set as now_version? Wait. 
            # create_node creates initial version (v1) but does not set node.now_version explicitly?
            # It should set it if we want strictness.
            # But line 50: version = DocumentVersionSQLEntity(...)
            # It doesn't set node.now_version.
            # I should fix create_node to set node.now_version = version.id
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
        now_version_id = None
        
        if node.node_type == NodeTypeEnum.DOCUMENT.value:
            # 获取指定版本(now_version) 或 最新版本
            latest_version = None
            if node.now_version:
                stmt_ver = select(DocumentVersionSQLEntity).where(
                    DocumentVersionSQLEntity.node_id == node.id,
                    DocumentVersionSQLEntity.version == node.now_version
                )
                result_ver = await self.session.execute(stmt_ver)
                latest_version = result_ver.scalar_one_or_none()
            
            if not latest_version:
                # Fallback to latest by version number
                stmt_ver = select(DocumentVersionSQLEntity)\
                    .where(DocumentVersionSQLEntity.node_id == node_id)\
                    .order_by(DocumentVersionSQLEntity.version.desc())\
                    .limit(1)
                result_ver = await self.session.execute(stmt_ver)
                latest_version = result_ver.scalar_one_or_none()
            
            if latest_version:
                content = latest_version.full_text
                word_count = latest_version.word_count
                now_version_id = latest_version.id
        
        # 获取父节点ID
        stmt_parent = select(NodeRelationshipSQLEntity.from_node_id)\
            .where(NodeRelationshipSQLEntity.to_node_id == node_id)
        result_parent = await self.session.execute(stmt_parent)
        parent_id = result_parent.scalar_one_or_none()

        return NodeDetailResponse(
            id=node.id,
            work_id=node.work_id,
            name=node.name,
            content=content,
            type=NodeTypeEnum(node.node_type),
            word_count=word_count,
            description=node.description,
            parent_node_id=parent_id,
            now_version=latest_version.version if latest_version else None,
            now_version_id=now_version_id
        )

    async def update_node(self, node_id: str, request: UpdateNodeDTO) -> NodeDetailResponse:
        """更新节点（重命名/移动）- 不处理内容更新."""
        stmt = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        
        if not node:
            raise ResourceNotFoundError(f"Node not found: {node_id}")
            
        # Update Meta
        if request.name is not None:
            node.name = request.name
            
        if request.description is not None:
            node.description = request.description
        
        if request.parent_node_id is not None:
            # TODO: Validate parent_id exists and no cycle
            # Update Relationship
            # 1. Remove old parent relationship
            stmt_del_rel = select(NodeRelationshipSQLEntity)\
                .where(NodeRelationshipSQLEntity.to_node_id == node_id)
            result_del_rel = await self.session.execute(stmt_del_rel)
            old_rel = result_del_rel.scalars().all()
            for r in old_rel:
                await self.session.delete(r)
            
            # 2. Add new parent relationship
            new_rel = NodeRelationshipSQLEntity(
                work_id=node.work_id,
                from_node_id=request.parent_node_id.hex,
                to_node_id=node.id
            )
            self.session.add(new_rel)
            
        node.update_at = get_now_time()
        await self.session.commit()
        await self.session.refresh(node)
        
        # 获取父节点ID (For response)
        stmt_parent = select(NodeRelationshipSQLEntity.from_node_id)\
            .where(NodeRelationshipSQLEntity.to_node_id == node_id)
        result_parent = await self.session.execute(stmt_parent)
        parent_id = result_parent.scalar_one_or_none()
        
        # Get content for response
        content = ""
        word_count = 0
        current_version_id = None
        now_version_id = None
        
        if node.node_type == "document":
            # Fetch existing content for response
            latest_version = None
            if node.now_version:
                 stmt_ver = select(DocumentVersionSQLEntity).where(
                     DocumentVersionSQLEntity.node_id == node.id,
                     DocumentVersionSQLEntity.version == node.now_version
                 )
                 result_ver = await self.session.execute(stmt_ver)
                 latest_version = result_ver.scalar_one_or_none()
            
            if not latest_version:
                stmt_ver = select(DocumentVersionSQLEntity)\
                    .where(DocumentVersionSQLEntity.node_id == node_id)\
                    .order_by(DocumentVersionSQLEntity.version.desc())\
                    .limit(1)
                result_ver = await self.session.execute(stmt_ver)
                latest_version = result_ver.scalar_one_or_none()
                
            if latest_version:
                content = latest_version.full_text
                word_count = latest_version.word_count
                current_version_id = latest_version.version
                now_version_id = latest_version.id # Get UUID

        return NodeDetailResponse(
            id=node.id,
            work_id=node.work_id,
            name=node.name,
            content=content,
            type=NodeTypeEnum(node.node_type),
            word_count=word_count,
            description=node.description,
            parent_node_id=parent_id,
            now_version=current_version_id,
            now_version_id=now_version_id
        )

    async def get_document_version_detail_and_switch(self, node_id: str, version_id: str) -> DocumentDetailResponse:
        """获取指定版本的文档详情，并更新节点的 now_version 为该版本."""
        # 1. Get Node
        stmt = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        
        if not node:
             raise ResourceNotFoundError(f"Node not found: {node_id}")

        # 2. Get Version (Check existence)
        # version_id here is the UUID of the version
        stmt_ver = select(DocumentVersionSQLEntity).where(
            DocumentVersionSQLEntity.node_id == node_id,
            DocumentVersionSQLEntity.id == version_id
        )
        result_ver = await self.session.execute(stmt_ver)
        version = result_ver.scalar_one_or_none()
        
        if not version:
             raise ResourceNotFoundError(f"Version not found: {version_id}")

        # 3. Update Node's now_version to this version's version_name (version field)
        # Note: now_version stores the version string (e.g., "v1.0.0"), not UUID.
        if node.now_version != version.version:
             node.now_version = version.version
             node.update_at = get_now_time()
             await self.session.commit()
             await self.session.refresh(node)
        
        # 4. Get Parent ID
        stmt_parent = select(NodeRelationshipSQLEntity.from_node_id)\
            .where(NodeRelationshipSQLEntity.to_node_id == node_id)
        result_parent = await self.session.execute(stmt_parent)
        parent_id = result_parent.scalar_one_or_none()

        return DocumentDetailResponse(
            id=node.id,
            work_id=node.work_id,
            title=node.name,
            description=node.description,
            from_node_id=parent_id,
            full_text=version.full_text,
            now_version=version.version,
            now_version_id=version.id
        )

    async def update_document_version_content(self, node_id: str, version_id: str, content: str) -> DocumentDetailResponse:
        """更新指定文档版本的内容."""
        # 1. Get Node (Check existence)
        stmt = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        if not node:
             raise ResourceNotFoundError(f"Node not found: {node_id}")

        # 2. Get Version (By UUID)
        stmt_ver = select(DocumentVersionSQLEntity).where(
            DocumentVersionSQLEntity.node_id == node_id,
            DocumentVersionSQLEntity.id == version_id
        )
        result_ver = await self.session.execute(stmt_ver)
        version = result_ver.scalar_one_or_none()
        
        if not version:
             raise ResourceNotFoundError(f"Version not found: {version_id}")
        
        # 3. Update Content
        version.full_text = content
        version.word_count = len(content)
        
        # 4. If this is the current version, update node update_at
        if node.now_version == version.version:
             node.update_at = get_now_time()
             
        await self.session.commit()
        await self.session.refresh(version)
        
        # 5. Get Parent ID
        stmt_parent = select(NodeRelationshipSQLEntity.from_node_id)\
            .where(NodeRelationshipSQLEntity.to_node_id == node_id)
        result_parent = await self.session.execute(stmt_parent)
        parent_id = result_parent.scalar_one_or_none()
        
        return DocumentDetailResponse(
            id=node.id,
            work_id=node.work_id,
            title=node.name,
            description=node.description,
            from_node_id=parent_id,
            full_text=version.full_text,
            now_version=node.now_version,
            now_version_id=version.id
        )


    async def get_document_versions(self, node_id: str) -> DocumentVersionResponse:
        """获取文档版本列表."""
        stmt = select(DocumentVersionSQLEntity)\
            .where(DocumentVersionSQLEntity.node_id == node_id)\
            .order_by(DocumentVersionSQLEntity.create_at.desc())
        
        result = await self.session.execute(stmt)
        versions = result.scalars().all()
        
        return DocumentVersionResponse(
            versions=[
                DocumentVersionItem(
                    id=v.id,
                    version=v.version,
                    create_at=v.create_at
                ) for v in versions
            ]
        )

    async def create_document_version(self, node_id: str, request: DocumentVersionCreateRequest) -> None:
        """创建新版本 (基于当前 now_version)."""
        # 1. Get Node
        stmt = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        
        if not node:
             raise ResourceNotFoundError(f"Node not found: {node_id}")

        # 2. Get Current Version Content
        current_content = ""
        current_word_count = 0
        
        if node.now_version:
             stmt_ver = select(DocumentVersionSQLEntity).where(
                 DocumentVersionSQLEntity.node_id == node.id,
                 DocumentVersionSQLEntity.version == node.now_version
             )
             result_ver = await self.session.execute(stmt_ver)
             current_ver = result_ver.scalar_one_or_none()
             if current_ver:
                 current_content = current_ver.full_text
                 current_word_count = current_ver.word_count
        
        # 3. Determine New Version Name
        # Logic: If request.version_name provided, use it.
        # Else: Increment last version number. e.g. v1 -> v2
        new_version_name = request.version_name
        
        if not new_version_name:
             # Find latest version to increment
             stmt_latest = select(DocumentVersionSQLEntity)\
                 .where(DocumentVersionSQLEntity.node_id == node_id)\
                 .order_by(DocumentVersionSQLEntity.create_at.desc())\
                 .limit(1)
             result_latest = await self.session.execute(stmt_latest)
             latest = result_latest.scalar_one_or_none()
             
             if latest:
                 # Try to parse 'vX' or 'X'
                 try:
                     import re
                     match = re.search(r'(\d+)', latest.version)
                     if match:
                         ver_num = int(match.group(1))
                         new_version_name = f"v{ver_num + 1}"
                     else:
                         new_version_name = f"{latest.version}.1"
                 except:
                     new_version_name = f"v_{uuid.uuid4().hex[:8]}"
             else:
                 new_version_name = "v1"

        # 4. Create New Version
        new_ver = DocumentVersionSQLEntity(
            node_id=node.id,
            version=new_version_name,
            full_text=current_content, # Inherit content
            word_count=current_word_count,
            create_at=get_now_time()
        )
        self.session.add(new_ver)
        await self.session.flush() # Get ID
        
        # 5. Set as current version
        node.now_version = new_ver.version
        node.update_at = get_now_time()
        
        await self.session.commit()

    async def delete_document_version(self, node_id: str, version_id: str) -> None:
        """删除指定版本 (UUID)."""
        # version_id is UUID
        stmt = select(DocumentVersionSQLEntity).where(
            DocumentVersionSQLEntity.node_id == node_id,
            DocumentVersionSQLEntity.id == version_id
        )
        result = await self.session.execute(stmt)
        ver = result.scalar_one_or_none()
        
        if not ver:
             raise ResourceNotFoundError(f"Version not found: {version_id}")
             
        # Check if it is the current version
        stmt_node = select(NodeSQLEntity).where(NodeSQLEntity.id == node_id)
        result_node = await self.session.execute(stmt_node)
        node = result_node.scalar_one_or_none()
        
        if node and node.now_version == ver.version:
             # If deleting current version, we must switch to another one or allow null?
             # Strategy: Switch to latest created version that is not this one
             stmt_latest = select(DocumentVersionSQLEntity)\
                 .where(DocumentVersionSQLEntity.node_id == node_id, DocumentVersionSQLEntity.id != version_id)\
                 .order_by(DocumentVersionSQLEntity.create_at.desc())\
                 .limit(1)
             result_latest = await self.session.execute(stmt_latest)
             latest = result_latest.scalar_one_or_none()
             
             if latest:
                 node.now_version = latest.version
             else:
                 node.now_version = None # No versions left
        
        await self.session.delete(ver)
        await self.session.commit()

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
