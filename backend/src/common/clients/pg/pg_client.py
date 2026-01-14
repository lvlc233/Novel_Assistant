from typing import List,Tuple,Union
from sqlmodel import select, col
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from common.enums import NodeTypeEnum
from common.clients.pg.pg_models import (
    DocumentMetadataSQLEntity,
    DocumentVersionSQLEntity, 
    NovelSQLEntity, 
    FolderSQLEntity, 
    TreeSortSQLEntity, 
    UserSQLEntity
)

from common.errors import (
    UserExistsError,
    UserNotFoundError,
    UserPasswordError
)
from common.utils import passwd_verify
from common.clients.pg.pg_models import NovelKDMappingSQLEntity
from common.log.log import db_logger
import os
engine = create_async_engine(os.getenv("DATABASE_URL"), echo=True, future=True)

async def get_session() -> AsyncSession:
    async with AsyncSession(engine) as session:
        yield session

class PGClient:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    """
        用户相关操作
    """
    async def get_user_by_id(self, user_id: str) -> UserSQLEntity|None:
        """根据用户ID获取用户"""
        try:
            user = await self.session.get(UserSQLEntity, user_id)
            return user
        except Exception as e:
            db_logger.error(f"数据库异常:位置`get_user_by_id`:参数信息 {e}")
            raise e
            
    async def check_user_exist_by_id(self, user_id: str) -> bool:
        """检查用户是否存在,若存在则返回True,否则返回False"""
        user = await self.get_user_by_id(user_id)
        return user is not None

    """
        小说相关操作
    """
    async def get_novel_by_id(self, novel_id: str) -> NovelSQLEntity | None:
        """根据小说ID获取小说"""
        return await self.session.get(NovelSQLEntity, novel_id)

    async def get_novel_word_count(self, novel_id: str) -> int:
        """获取小说总字数"""
        stmt = (
            select(func.coalesce(func.sum(DocumentVersionSQLEntity.document_word_count), 0))
            .select_from(DocumentMetadataSQLEntity)
            .join(DocumentVersionSQLEntity, DocumentMetadataSQLEntity.document_current_version_id == DocumentVersionSQLEntity.document_version_id)
            .where(DocumentMetadataSQLEntity.novel_id == novel_id)
            .where(DocumentMetadataSQLEntity.document_is_remove == False)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_novel_directory_elements(self, novel_id: str):
        """
        获取小说目录相关的所有元素：TreeSort, Folder, DocumentMetadata, DocumentVersion(用于字数)
        """
        # 1. Get TreeSort items
        stmt_tree = select(TreeSortSQLEntity).where(TreeSortSQLEntity.novel_id == novel_id).order_by(TreeSortSQLEntity.node_sort_order)
        tree_results = await self.session.execute(stmt_tree)
        tree_items = tree_results.scalars().all()
        
        # 2. Get Folders
        stmt_folder = select(FolderSQLEntity).where(FolderSQLEntity.novel_id == novel_id)
        folder_results = await self.session.execute(stmt_folder)
        folders = folder_results.scalars().all()
        folder_map = {f.folder_id: f for f in folders}
        
        # 3. Get Documents (joined with version for word count)
        # We need doc title, update time, and word count.
        stmt_doc = (
            select(DocumentMetadataSQLEntity, DocumentVersionSQLEntity.document_word_count)
            .outerjoin(DocumentVersionSQLEntity, DocumentMetadataSQLEntity.document_current_version_id == DocumentVersionSQLEntity.document_version_id)
            .where(DocumentMetadataSQLEntity.novel_id == novel_id)
            .where(DocumentMetadataSQLEntity.document_is_remove == False)
        )
        doc_results = await self.session.execute(stmt_doc)
        # Result is list of (DocumentMetadataSQLEntity, word_count)
        docs = doc_results.all()
        doc_map = {d[0].document_id: (d[0], d[1]) for d in docs}
        
        return tree_items, folder_map, doc_map

    async def create_novel_entity(
        self, 
        user_id: str, 
        novel_cover_image_url:str|None=None,
        novel_name: str|None=None, 
        novel_summary: str|None=None,
        ) -> NovelSQLEntity:
        """创建小说"""

        novel = NovelSQLEntity(
            user_id=user_id, 
            novel_cover_image_url=novel_cover_image_url,
            novel_name=novel_name, 
            novel_summary=novel_summary,
        )
        
        self.session.add(novel) 
        await self.session.flush()
        await self.session.refresh(novel)
        return novel

    async def get_user_active_novels_with_word_count(self, user_id: str) -> List[Tuple[NovelSQLEntity, int]]:
        """获取用户所有未删除的小说列表及总字数"""

        stmt = (
            select(NovelSQLEntity, func.coalesce(func.sum(DocumentVersionSQLEntity.document_word_count), 0).label("total_word_count"))
            .outerjoin(DocumentMetadataSQLEntity, 
                       (NovelSQLEntity.novel_id == DocumentMetadataSQLEntity.novel_id) & 
                       (DocumentMetadataSQLEntity.document_is_remove == False))
            .outerjoin(DocumentVersionSQLEntity, 
                       DocumentMetadataSQLEntity.document_current_version_id == DocumentVersionSQLEntity.document_version_id)
            .where(
                NovelSQLEntity.user_id == user_id,
                NovelSQLEntity.novel_is_remove == False
            )
            .group_by(NovelSQLEntity.novel_id)
            .order_by(NovelSQLEntity.novel_create_time.desc())
        )
        result = await self.session.execute(stmt)
        return result.all()

    """
        小说和知识库映射
        novel_kd_mapping
    """
    async def creat_novel_kd_mapping(self, novel_id: str, kd_id_list: List[str]) -> bool:
        """创建小说和知识库的映射关系"""
        
        if not kd_id_list:
            return True
        
        # 批量插入映射记录
        mappings = [
            NovelKDMappingSQLEntity(
                novel_id=novel_id,
                kd_id=kd_id
            )
            for kd_id in kd_id_list
        ]
        
        self.session.add_all(mappings)
        await self.session.flush()
        return True


    """
        文件夹:
    """
    # 创建文件夹
    async def create_folder(
        self, 
        novel_id: str, 
        folder_name: str
        ) -> FolderSQLEntity:
        """创建文件夹"""
        folder = FolderSQLEntity(
            novel_id=novel_id, 
            folder_name=folder_name, 
        )
        self.session.add(folder) 
        await self.session.flush()
        await self.session.refresh(folder)
        return folder

    async def delete_folder_by_id(self, folder_id: str) -> bool:
        """根据ID删除文件夹"""
        folder = await self.session.get(FolderSQLEntity, folder_id)
        if folder:
            await self.session.delete(folder)
            await self.session.flush()
            return True
        return False
    
    async def update_folder_name(self, folder_id: str, folder_name: str) -> bool:
        """更新文件夹名称"""
        folder = await self.session.get(FolderSQLEntity, folder_id)
        if folder:
            folder.folder_name = folder_name
            self.session.add(folder)
            await self.session.flush()
            return True
        return False

    async def update_document_title(self, document_id: str, document_title: str) -> bool:
        """更新文档标题"""
        doc = await self.session.get(DocumentMetadataSQLEntity, document_id)
        if doc:
            doc.document_title = document_title
            self.session.add(doc)
            await self.session.flush()
            return True
        return False

    """
        文档:
    """
    async def create_document_metadata(
        self,
        user_id: str,
        novel_id: str,
        document_title: str,
        document_current_version_id: str,
        folder_id: str | None = None
    ) -> DocumentMetadataSQLEntity:
        """创建文档元数据"""
        doc = DocumentMetadataSQLEntity(
            user_id=user_id,
            novel_id=novel_id,
            document_title=document_title,
            document_current_version_id=document_current_version_id,
            folder_id=folder_id
        )
        self.session.add(doc)
        await self.session.flush()
        await self.session.refresh(doc)
        return doc

    async def create_document_version(
        self,
        document_id: str,
        document_body_text: str = "",
        document_parent_version_id: str | None = None
    ) -> DocumentVersionSQLEntity:
        """创建文档版本"""
        doc_version = DocumentVersionSQLEntity(
            document_id=document_id,
            document_body_text=document_body_text,
            document_parent_version_id=document_parent_version_id,
            document_word_count=len(document_body_text)
        )
        self.session.add(doc_version)
        await self.session.flush()
        await self.session.refresh(doc_version)
        return doc_version

    async def get_document_by_doc_id(self, document_id: str) -> DocumentMetadataSQLEntity | None:
        """根据ID获取文档元数据"""
        return await self.session.get(DocumentMetadataSQLEntity, document_id)

    async def get_document_version_by_doc_id_and_version_id(
        self, 
        document_id: str, 
        document_version_id: str
    ) -> DocumentVersionSQLEntity | None:
        """根据文档ID和版本ID获取文档版本"""
        return await self.session.get(DocumentVersionSQLEntity, document_version_id)

    async def get_document_versions_by_doc_id(self, document_id: str) -> List[DocumentVersionSQLEntity]:
        """根据文档ID获取所有版本"""
        stmt = select(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.document_id == document_id).order_by(DocumentVersionSQLEntity.document_create_time.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def soft_delete_document_by_id(self, document_id: str) -> bool:
        """软删除文档"""
        doc = await self.session.get(DocumentMetadataSQLEntity, document_id)
        if doc:
            doc.document_is_remove = True
            self.session.add(doc)
            await self.session.flush()
            return True
        return False

    async def update_document_current_version_id(self, document_id: str, version_id: str) -> bool:
        """更新文档当前版本ID"""
        doc = await self.session.get(DocumentMetadataSQLEntity, document_id)
        if doc:
            doc.document_current_version_id = version_id
            self.session.add(doc)
            await self.session.flush()
            return True
        return False
    
    """
        节点关联
    """
    async def create_tree_sort(
        self, 
        novel_id: str, 
        node_type:str,
        node_id:str,
        parent_id: str|None=None,
    
        ) -> TreeSortSQLEntity:
        """创建节点关联"""
        tree_sort = TreeSortSQLEntity(
            novel_id=novel_id, 
            node_type=node_type,
            node_id=node_id,
            parent_id=parent_id,
        )
        self.session.add(tree_sort) 
        await self.session.flush()
        await self.session.refresh(tree_sort)
        return tree_sort

    async def delete_tree_sort_by_node_id(self, node_id: str, node_type: str) -> bool:
        """根据节点ID和类型删除节点关联"""
        stmt = select(TreeSortSQLEntity).where(
            TreeSortSQLEntity.node_id == node_id,
            TreeSortSQLEntity.node_type == node_type
        )
        result = await self.session.execute(stmt)
        tree_sort = result.scalars().first()
        
        if tree_sort:
            await self.session.delete(tree_sort)
            await self.session.flush()
            return True
        return False

