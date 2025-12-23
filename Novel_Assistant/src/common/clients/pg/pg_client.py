
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
    """?"""
    # async def check_user_exist_by_name(self, name: str) -> bool:
    #     """检查用户是否存在,若存在则返回True,否则返回False"""
    #     user = await self.get_user_by_name(name)
    #     return user is not None



    # async def create_user(self, name: str, password: str) -> UserSQLEntity:
    #     if await self.check_user_exist_by_name(name):
    #         raise UserExistsError(name)    
    #     user = UserSQLEntity(name=name, password=password)
    #     self.session.add(user)
    #     await self.session.flush()
    #     await self.session.refresh(user)
    #     return user

    # async def user_login(self, name: str, password: str) -> UserSQLEntity:
    #     """用户登录"""
    #     statement = select(UserSQLEntity).where(UserSQLEntity.name == name)
    #     result = await self.session.execute(statement)
    #     user :UserSQLEntity|None = result.scalars().first()
    #     if user is None:
    #         raise UserNotFoundError(name)
    #     if not passwd_verify(password, user.password):
    #         raise UserPasswordError(name, password)
    #     return user

    # async def get_user(self, user_id: str) -> UserSQLEntity|None:
    #     """根据用户ID获取用户"""
    #     user = await self.session.get(UserSQLEntity, user_id)
    #     return user


    # async def get_user_by_name(self, name: str) -> UserSQLEntity|None:    
    #     """根据用户名获取用户"""
    #     statement = select(UserSQLEntity).where(UserSQLEntity.name == name)
    #     result = await self.session.execute(statement)
    #     return result.scalars().first()


    """
        小说相关操作
    """
    
    async def check_novel_exist_by_id(self, novel_id: str) -> bool:
        """检查小说是否存在,若存在则返回True,否则返回False"""
        novel = await self.session.get(NovelSQLEntity, novel_id)
        return novel is not None

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


    """?"""
    async def get_user_active_novels(self, user_id: str) -> List[NovelSQLEntity]:
        """获取用户所有未删除的小说列表"""
        stmt_novel = select(NovelSQLEntity).where(
            NovelSQLEntity.user_id == user_id,
            NovelSQLEntity.is_remove == False
        )
        result_novel = await self.session.execute(stmt_novel)
        return result_novel.scalars().all()

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



    async def get_removed_novel_list(self, user_id: str) -> List[NovelSQLEntity]:
        """获取用户所有已删除的小说列表"""
        statement = select(NovelSQLEntity).where(
            NovelSQLEntity.user_id == user_id, 
            NovelSQLEntity.is_remove == True
        )
        result = await self.session.execute(statement)
        return result.scalars().all()     


        
    async def get_novel_details(self, novel_id: str) -> NovelSQLEntity|None:
        """获取小说详情"""
        statement = select(NovelSQLEntity).where(
            NovelSQLEntity.novel_id == novel_id
        )
        result = await self.session.execute(statement)
        return result.scalars().first()


    async def delete_novel(self, novel_id: str) -> bool:
        """删除小说"""
        novel = await self.session.get(NovelSQLEntity, novel_id)
        if novel:
            novel.is_remove = True
            self.session.add(novel)
            await self.session.flush()
            return True
        return False

    async def update_novel(self, novel_id: str, name: str | None = None, description: str | None = None) -> bool:
        """更新小说信息（不更新update_time）"""
        novel = await self.session.get(NovelSQLEntity, novel_id)
        if novel:
            if name is not None:
                novel.name = name
            if description is not None:
                novel.description = description
            self.session.add(novel)
            await self.session.flush()
            return True
        return False

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
        文档元数据相关操作
        document_metadata
    """
    async def get_document_by_novel_id_batch(self, novel_id_list: List[str]) -> List[DocumentMetadataSQLEntity]:
        """根据小说ID列表批量获取文档元数据"""
        if not novel_id_list:
            return []
        stmt_doc = select(DocumentMetadataSQLEntity).where(
            DocumentMetadataSQLEntity.novel_id.in_(novel_id_list)
        )
        result_doc = await self.session.execute(stmt_doc)
        return result_doc.scalars().all()
    # # ok
    # async def get_novel_document_list_by_novel_id(self, novel_id: str) -> List[DocumentSQLEntity]:
    #     """根据小说ID获取文档数据"""
    #     if not novel_id:
    #         return []
    #     stmt_doc = select(DocumentSQLEntity).where(DocumentSQLEntity.novel_id == novel_id)
    #     result_doc = await self.session.execute(stmt_doc)
    #     return result_doc.scalars().all()

    # async def create_novel_document(self, user_id: str,novel_id: str,folder_id: str|None=None) -> DocumentSQLEntity:
    #     """创建文档"""
    #     document = DocumentSQLEntity(user_id=user_id,novel_id=novel_id, folder_id=folder_id)
    #     self.session.add(document)
    #     await self.session.flush()
    #     await self.session.refresh(document)
    #     return document

    # async def soft_delete_document(self, doc_id: str) -> bool:
    #     """软删除文档"""
    #     document = await self.session.get(DocumentSQLEntity, doc_id)
    #     if document:
    #         document.is_remove = True
    #         self.session.add(document)
    #         await self.session.flush()
    #         return True
    #     return False


    # # ok
    # async def get_document_by_doc_id(self, doc_id: str) -> DocumentSQLEntity | None:
    #     """根据ID获取文档"""
    #     return await self.session.get(DocumentSQLEntity, doc_id)
    # # ok
    # async def get_document_version_by_doc_id_and_version_id(self, doc_id: str, version_id: str) -> DocumentVersionSQLEntity | None:
    #     """根据 doc_id 与 version_id 获取对应的文档版本"""
    #     stmt = select(DocumentVersionSQLEntity).where(
    #         DocumentVersionSQLEntity.doc_id == doc_id,
    #         DocumentVersionSQLEntity.version_id == version_id
    #     )
    #     result = await self.session.execute(stmt)
    #     return result.scalars().first()


    """
        文档版本相关操作
        document_version
    """
    async def get_document_current_version_by_document_id_batch(self, document_id_list: List[str]) -> List[DocumentVersionSQLEntity]:
        """根据文档ID列表批量获取当前版本"""
        if not document_id_list:
            return []
        # 先查出所有文档的 current_version_id
        stmt_doc = select(DocumentMetadataSQLEntity.doc_id, DocumentMetadataSQLEntity.current_version_id).where(
            DocumentMetadataSQLEntity.doc_id.in_(document_id_list)
        )
        result_doc = await self.session.execute(stmt_doc)
        rows = result_doc.all()
        if not rows:
            return []
        version_id_list = [row.current_version_id for row in rows if row.current_version_id]
        if not version_id_list:
            return []
        # 再批量查版本
        stmt_version = select(DocumentVersionSQLEntity).where(
            DocumentVersionSQLEntity.version_id.in_(version_id_list)
        )
        result_version = await self.session.execute(stmt_version)
        return result_version.scalars().all()

    # async def get_document_versions_by_document_id(self,document_id:str) -> List[DocumentVersionSQLEntity]:
    #     """根据小说ID获取文档版本数据"""
    #     if not document_id:
    #         return []
    #     stmt_doc_version = select(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.doc_id == document_id)    
    #     result_doc_version = await self.session.execute(stmt_doc_version)
    #     return result_doc_version.scalars().all()

    # # ???
    # async def get_document_versions_by_novel_id(self, novel_id: str) -> List[DocumentVersionSQLEntity]:
    #     """根据小说ID获取文档版本数据"""
    #     if not novel_id:
    #         return []
    #     stmt_doc_version = select(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.novel_id == novel_id)    
    #     result_doc_version = await self.session.execute(stmt_doc_version)
    #     return result_doc_version.scalars().all()

    # async def create_novel_document_version(
    #     self,
    #     version_id: str,
    #     doc_id: str, 
    #     novel_id: str,
    #     folder_id: str|None = None,
    #     parent_version_id: str|None=None,
    #     body_text: str|None=None
    # ) -> DocumentVersionSQLEntity:
    #     """创建文档版本"""
    #     document_version = DocumentVersionSQLEntity(
    #         version_id=version_id,
    #         parent_version_id=parent_version_id,
    #         doc_id=doc_id,
    #         novel_id=novel_id, 
    #         folder_id=folder_id,
    #         body_text=body_text
    #     )
    #     self.session.add(document_version)
    #     await self.session.flush()
    #     await self.session.refresh(document_version)
    #     return document_version
    
        
    # # end def
    # """
    #     文件夹相关操作
    # """
    # # ok
    # async def get_novel_folders(self, novel_id: str) -> List[FolderSQLEntity]:
    #     """根据小说ID获取文件夹数据"""
    #     if not novel_id:
    #         return []
    #     stmt_folder = select(FolderSQLEntity).where(FolderSQLEntity.novel_id == novel_id)
    #     result_folder = await self.session.execute(stmt_folder)
    #     return result_folder.scalars().all()
    # """
    #     层次结构相关操作
    # """
    # # ok
    # async def get_novel_tree_sorts_by_novel_id(self, novel_id: str) -> List[TreeSortSQLEntity]:
    #     """根据小说ID获取树结构数据"""
    #     if not novel_id:
    #         return []
    #     stmt_tree = select(TreeSortSQLEntity).where(TreeSortSQLEntity.novel_id == novel_id)
    #     result_tree = await self.session.execute(stmt_tree)
    #     return result_tree.scalars().all()

    # async def add_document_to_folder(self, novel_id: str, folder_id: str,doc_id: str) -> TreeSortSQLEntity:
    #     """创建树结构"""
    #     tree_sort = TreeSortSQLEntity(novel_id=novel_id, parent_id=folder_id, node_type=NodeTypeEnum.DOCUMENT, node_id=doc_id)
    #     self.session.add(tree_sort)
    #     await self.session.flush()
    #     await self.session.refresh(tree_sort)
    #     return tree_sort

    # """
    #     搜索相关操作
    # """
    # async def search_documents_by_title(self, is_remove: bool, keyword: str, novel_id: str | None = None) -> List[DocumentSQLEntity]:
    #     """根据标题搜索文档"""

    #     stmt = select(DocumentSQLEntity).join(
    #         DocumentVersionSQLEntity, 
    #         DocumentSQLEntity.current_version_id == DocumentVersionSQLEntity.version_id
    #     ).where(
    #         col(DocumentSQLEntity.title).contains(keyword),
    #         DocumentSQLEntity.is_remove == is_remove
    #     )
    #     if novel_id:
    #         stmt = stmt.where(DocumentSQLEntity.novel_id == novel_id)
        
    #     result = await self.session.execute(stmt)
    #     return result.scalars().all()

    # async def search_documents_by_content(self, is_remove: bool, keyword: str, novel_id: str | None = None) -> List[Tuple[DocumentSQLEntity, DocumentVersionSQLEntity]]:
    #     """根据正文搜索文档"""
    #     # 仅仅搜索当前版本current_version_id
    #     stmt = select(DocumentSQLEntity, DocumentVersionSQLEntity).join(
    #         DocumentVersionSQLEntity, 
    #         DocumentSQLEntity.current_version_id == DocumentVersionSQLEntity.version_id
    #     ).where(
    #         col(DocumentVersionSQLEntity.body_text).contains(keyword),
    #         DocumentSQLEntity.is_remove == is_remove
    #     )
    #     if novel_id:
    #         stmt = stmt.where(DocumentSQLEntity.novel_id == novel_id)
            
    #     result = await self.session.execute(stmt)
    #     return result.all()

    # async def update_document_title(self, doc_id: str, title: str) -> bool:
    #     """更新文档标题"""
    #     doc = await self.session.get(DocumentSQLEntity, doc_id)
    #     if doc:
    #         doc.title = title
    #         self.session.add(doc)
    #         await self.session.flush()
    #         return True
    #     return False
        
    # async def update_document_current_version(self, doc_id: str, version_id: str) -> bool:
    #     """更新文档当前版本"""
    #     doc = await self.session.get(DocumentSQLEntity, doc_id)
    #     if doc:
    #         doc.current_version_id = version_id
    #         self.session.add(doc)
    #         await self.session.flush()
    #         return True
    #     return False

    # async def create_folder(self, novel_id: str, name: str) -> FolderSQLEntity:
    #     """创建文件夹"""
    #     folder = FolderSQLEntity(novel_id=novel_id, name=name)
    #     self.session.add(folder)
    #     await self.session.flush()
    #     await self.session.refresh(folder)
    #     return folder

    # async def delete_folder(self, folder_id: str) -> bool:
    #     """删除文件夹"""
    #     folder = await self.session.get(FolderSQLEntity, folder_id)
    #     if folder:
    #         await self.session.delete(folder)
    #         await self.session.flush()
    #         return True
    #     return False

    # async def update_folder(self, folder_id: str, name: str) -> bool:
    #     """更新文件夹"""
    #     folder = await self.session.get(FolderSQLEntity, folder_id)
    #     if folder:
    #         folder.name = name
    #         self.session.add(folder)
    #         await self.session.flush()
    #         return True
    #     return False

    # async def add_node_to_tree(self, novel_id: str, node_id: str, node_type: str, parent_id: str | None = None, sort_order: int = 0) -> TreeSortSQLEntity:
    #     """添加节点到树结构"""
    #     tree_node = TreeSortSQLEntity(
    #         novel_id=novel_id,
    #         node_id=node_id,
    #         node_type=node_type,
    #         parent_id=parent_id,
    #         sort_order=sort_order
    #     )
    #     self.session.add(tree_node)
    #     await self.session.flush()
    #     await self.session.refresh(tree_node)
    #     return tree_node

    # async def get_tree_node(self, node_id: str) -> TreeSortSQLEntity | None:
    #     """根据节点ID获取树节点"""
    #     stmt = select(TreeSortSQLEntity).where(TreeSortSQLEntity.node_id == node_id)
    #     result = await self.session.execute(stmt)
    #     return result.scalars().first()

    # async def delete_tree_node(self, node_id: str) -> bool:
    #     """从树结构删除节点"""
    #     stmt = select(TreeSortSQLEntity).where(TreeSortSQLEntity.node_id == node_id)
    #     result = await self.session.execute(stmt)
    #     node = result.scalars().first()
    #     if node:
    #         await self.session.delete(node)
    #         await self.session.flush()
    #         return True
    #     return False
    
    # async def update_tree_node(self, node_id: str, parent_id: str | None, sort_order: int) -> bool:
    #     """更新树节点位置"""
    #     stmt = select(TreeSortSQLEntity).where(TreeSortSQLEntity.node_id == node_id)
    #     result = await self.session.execute(stmt)
    #     node = result.scalars().first()
    #     if node:
    #         node.parent_id = parent_id
    #         node.sort_order = sort_order
    #         self.session.add(node)
    #         await self.session.flush()
    #         return True
    #     return False


