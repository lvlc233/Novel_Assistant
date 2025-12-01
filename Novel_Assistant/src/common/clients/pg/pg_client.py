import asyncio
from typing import List, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

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
        statement = select(UserEntity).where(UserEntity.name == name)
        result = await self.session.execute(statement)
        user :UserEntity|None = result.scalars().first()
        if user is None:
            raise UserNotFoundError(name)
        if not passwd_verify(password, user.password):
            raise UserPasswordError(name, password)
        return user

    async def get_user(self, user_id: str) -> UserSQLEntity|None:
        """根据用户ID获取用户"""
        user = await self.session.get(UserEntity, user_id)
        return user


    async def get_user_by_name(self, name: str) -> UserSQLEntity|None:    
        """根据用户名获取用户"""
        statement = select(UserEntity).where(UserEntity.name == name)
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
        
        novel = NovelEntity(user_id=user_id, name=novel_name, description=description)
        
        self.session.add(novel) 
        await self.session.flush()
        await self.session.refresh(novel)
        return novel

    async def get_existing_novel_list(self, user_id: str) -> List[NovelSQLEntity]: 
        statement = select(NovelSQLEntity).where(
            NovelSQLEntity.user_id == user_id, 
            NovelSQLEntity.is_remove == False
        )
        result = await self.session.execute(statement)
        return result.scalars().all()

    async def get_removed_novel_list(self, user_id: str) -> List[NovelSQLEntity]:
        statement = select(NovelSQLEntity).where(
            NovelSQLEntity.user_id == user_id, 
            NovelSQLEntity.is_remove == True
        )
        result = await self.session.execute(statement)
        return result.scalars().all()     

    async def check_novel_exist(self, novel_id: str) -> bool:
        """检查小说是否存在"""
        statement = select(NovelEntity).where(
            NovelEntity.id == novel_id, 
            NovelEntity.is_remove == False
        )
        result = await self.session.execute(statement)
        return result.scalars().first() is not None
        
    async def get_novel_details(self, novel_id: str) -> NovelSQLEntity|None:
        """获取小说详情"""
        statement = select(NovelSQLEntity).where(
            NovelSQLEntity.novel_id == novel_id, 
            NovelSQLEntity.is_remove == False
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

    """
        文档相关操作
    """
    async def create_document(self, document: DocumentSQLEntity) -> DocumentSQLEntity:
        self.session.add(document)
        await self.session.flush()
        await self.session.refresh(document)     
        return document

    async def get_document(self, doc_id: str) -> Optional[DocumentSQLEntity]:
        return await self.session.get(DocumentSQLEntity, doc_id)

    async def update_document(self, document: DocumentSQLEntity) -> DocumentSQLEntity:  
        self.session.add(document)
        await self.session.flush()
        await self.session.refresh(document)
        return document

    async def delete_document(self, doc_id: str) -> bool:
        document = await self.session.get(DocumentEntity, doc_id)
        if document:
            document.is_remove = True
            self.session.add(document)
            await self.session.flush()
            return True
        return False

    """
        文档版本相关操作
    """
    async def create_document_version(self, version: DocumentVersionSQLEntity) -> DocumentVersionSQLEntity:
        self.session.add(version)
        await self.session.flush()
        await self.session.refresh(version)
        return version

    async def get_document_version(self, version_id: str) -> Optional[DocumentVersionSQLEntity]:
        return await self.session.get(DocumentVersionSQLEntity, version_id)    
    
    async def list_document_versions(self, doc_id: str) -> List[DocumentVersionSQLEntity]:  
        statement = select(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.doc_id == doc_id).order_by(DocumentVersionSQLEntity.create_time.desc())
        return await self.session.exec(statement).all()

    """
        文件夹相关操作
    """
    async def create_folder(self, folder: FolderSQLEntity) -> FolderSQLEntity:
        self.session.add(folder)
        await self.session.flush()
        await self.session.refresh(folder)
        return folder
    
    async def get_folder(self, folder_id: str) -> Optional[FolderSQLEntity]:
        return await self.session.get(FolderSQLEntity, folder_id)   

    async def list_folders(self, novel_id: str) -> List[FolderSQLEntity]:   
        statement = select(FolderEntity).where(FolderEntity.novel_id == novel_id)
        return await self.session.exec(statement).all()  

    """
        层次结构相关操作
    """
    async def add_tree_node(self, node: TreeSortSQLEntity) -> TreeSortSQLEntity:
        self.session.add(node)
        await self.session.flush()
        await self.session.refresh(node)
        return node

    async def get_novel_tree_by_novel_id(self, novel_id: str) -> List[TreeSortSQLEntity]:
        statement = select(TreeSortSQLEntity).where(TreeSortSQLEntity.novel_id == novel_id).order_by(TreeSortSQLEntity.sort_order)
        result = await self.session.execute(statement)
        return result.scalars().all()
            
    async def update_tree_node(self, node: TreeSortSQLEntity) -> TreeSortSQLEntity: 
        self.session.add(node)
        await self.session.flush()
        await self.session.refresh(node) 
        return node

    async def delete_tree_node(self, tree_id: str) -> bool:
        node = await self.session.get(TreeSortEntity, tree_id)
        if node:
            await self.session.delete(node)
            await self.session.flush()
            return True
        return False
