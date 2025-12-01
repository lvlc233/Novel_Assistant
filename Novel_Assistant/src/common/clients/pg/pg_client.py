
from typing import List
from sqlmodel import select, col
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from common.enums import NodeTypeEnum
from common.clients.pg.pg_models import (
    DocumentSQLEntity, 
    DocumentVersionSQLEntity, 
    NovelSQLEntity, 
    FolderSQLEntity, 
    TreeSortSQLEntity, 
    UserSQLEntity
)



from common.err import (
    UserExistsError,
    UserNotFoundError,
    UserPasswordError
)
from common.utils import passwd_verify
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
    async def check_user_exist_by_name(self, name: str) -> bool:
        """检查用户是否存在,若存在则返回True,否则返回False"""
        user = await self.get_user_by_name(name)
        return user is not None

    async def check_user_exist_by_id(self, user_id: str) -> bool:
        """检查用户是否存在,若存在则返回True,否则返回False"""
        user = await self.get_user_by_id(user_id)
        return user is not None

    async def create_user(self, name: str, password: str) -> UserSQLEntity:
        if await self.check_user_exist_by_name(name):
            raise UserExistsError(name)    
        user = UserSQLEntity(name=name, password=password)
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def user_login(self, name: str, password: str) -> UserSQLEntity:
        """用户登录"""
        statement = select(UserSQLEntity).where(UserSQLEntity.name == name)
        result = await self.session.execute(statement)
        user :UserSQLEntity|None = result.scalars().first()
        if user is None:
            raise UserNotFoundError(name)
        if not passwd_verify(password, user.password):
            raise UserPasswordError(name, password)
        return user

    async def get_user(self, user_id: str) -> UserSQLEntity|None:
        """根据用户ID获取用户"""
        user = await self.session.get(UserSQLEntity, user_id)
        return user


    async def get_user_by_name(self, name: str) -> UserSQLEntity|None:    
        """根据用户名获取用户"""
        statement = select(UserSQLEntity).where(UserSQLEntity.name == name)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_user_by_id(self, user_id: str) -> UserSQLEntity|None:
        """根据用户ID获取用户"""
        user = await self.session.get(UserSQLEntity, user_id)
        return user
    """
        小说相关操作
    """
    async def create_novel(self, user_id: str, novel_name: str|None=None, description: str|None=None) -> NovelSQLEntity:
        
        novel = NovelSQLEntity(user_id=user_id, name=novel_name, description=description)
        
        self.session.add(novel) 
        await self.session.flush()
        await self.session.refresh(novel)
        return novel

    async def get_user_active_novels(self, user_id: str) -> List[NovelSQLEntity]:
        """获取用户所有未删除的小说列表"""
        stmt_novel = select(NovelSQLEntity).where(
            NovelSQLEntity.user_id == user_id,
            NovelSQLEntity.is_remove == False
        )
        result_novel = await self.session.execute(stmt_novel)
        return result_novel.scalars().all()


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
        文档相关操作
    """
    
    async def get_novel_documents(self, novel_id: str) -> List[DocumentSQLEntity]:
        """根据小说ID获取文档数据"""
        if not novel_id:
            return []
        stmt_doc = select(DocumentSQLEntity).where(DocumentSQLEntity.novel_id == novel_id)
        result_doc = await self.session.execute(stmt_doc)
        return result_doc.scalars().all()

    async def create_novel_document(self, user_id: str,novel_id: str,folder_id: str|None=None) -> DocumentSQLEntity:
        """创建文档"""
        document = DocumentSQLEntity(user_id=user_id,novel_id=novel_id, folder_id=folder_id)
        self.session.add(document)
        await self.session.flush()
        await self.session.refresh(document)
        return document

    async def check_novel_exist_by_id(self, novel_id: str) -> bool:
        """检查小说是否存在,若存在则返回True,否则返回False"""
        novel = await self.session.get(NovelSQLEntity, novel_id)
        return novel is not None

    """
        文档版本相关操作
    """

    async def get_novel_document_versions(self, novel_id: str) -> List[DocumentVersionSQLEntity]:
        """根据小说ID获取文档版本数据"""
        if not novel_id:
            return []
        stmt_doc_version = select(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.novel_id == novel_id)    
        result_doc_version = await self.session.execute(stmt_doc_version)
        return result_doc_version.scalars().all()

    async def create_novel_document_version(
        self,
        version_id: str,
        doc_id: str, 
        novel_id: str,
        folder_id: str|None = None,
        parent_version_id: str|None=None,
        body_text: str|None=None
    ) -> DocumentVersionSQLEntity:
        """创建文档版本"""
        document_version = DocumentVersionSQLEntity(
            version_id=version_id,
            parent_version_id=parent_version_id,
            doc_id=doc_id,
            novel_id=novel_id, 
            folder_id=folder_id,
            body_text=body_text
        )
        self.session.add(document_version)
        await self.session.flush()
        await self.session.refresh(document_version)
        return document_version
    """
        文件夹相关操作
    """
    async def get_novel_folders(self, novel_id: str) -> List[FolderSQLEntity]:
        """根据小说ID获取文件夹数据"""
        if not novel_id:
            return []
        stmt_folder = select(FolderSQLEntity).where(FolderSQLEntity.novel_id == novel_id)
        result_folder = await self.session.execute(stmt_folder)
        return result_folder.scalars().all()
        statement = select(FolderSQLEntity).where(FolderSQLEntity.novel_id == novel_id)
        return await self.session.exec(statement).all()  

    """
        层次结构相关操作
    """
    async def get_novel_tree_sorts(self, novel_id: str) -> List[TreeSortSQLEntity]:
        """根据小说ID获取树结构数据"""
        if not novel_id:
            return []
        stmt_tree = select(TreeSortSQLEntity).where(TreeSortSQLEntity.novel_id == novel_id)
        result_tree = await self.session.execute(stmt_tree)
        return result_tree.scalars().all()

    async def add_document_to_folder(self, novel_id: str, folder_id: str,doc_id: str) -> TreeSortSQLEntity:
        """创建树结构"""
        tree_sort = TreeSortSQLEntity(novel_id=novel_id, parent_id=folder_id, node_type=NodeTypeEnum.NOVEL, node_id=doc_id)
        self.session.add(tree_sort)
        await self.session.flush()
        await self.session.refresh(tree_sort)
        return tree_sort