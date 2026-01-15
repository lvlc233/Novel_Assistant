from typing import List, Optional, Tuple, Any
from datetime import datetime
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import select, update, delete, func, text

from infrastructure.pg.pg_models import (
    UserSQLEntity,
    NovelSQLEntity,
    FolderSQLEntity,
    DocumentMetadataSQLEntity,
    DocumentVersionSQLEntity,
    TreeSortSQLEntity,
    NovelKDMappingSQLEntity,
    KDSQLEntity
)
from common.errors import UserNotFoundError, UserLoginError

from common.config import settings

# Database Setup
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session

class PGClient:
    """PostgreSQL Client using generic repository pattern where applicable."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    # User Methods
    # Note: 这里不提交(commit)，仅flush以获取ID。事务提交由Service层统一管理。
    async def create_user(self, name: str, password_hash: str) -> UserSQLEntity:
        user = UserSQLEntity(user_name=name, user_password=password_hash)
        self.session.add(user)
        await self.session.flush()
        return user

    async def check_user_exist_by_id(self, user_id: str) -> bool:
        statement = select(UserSQLEntity).where(UserSQLEntity.user_id == user_id)
        result = await self.session.execute(statement)
        return result.scalars().first() is not None

    async def user_login(self, name: str, password_hash: str) -> UserSQLEntity:
        statement = select(UserSQLEntity).where(
            UserSQLEntity.user_name == name, 
            UserSQLEntity.user_password == password_hash
        )
        result = await self.session.execute(statement)
        user = result.scalars().first()
        if user is None:
            raise UserLoginError(name, "********") # Mask password in error
        return user

    # Novel Methods
    async def create_novel_entity(
        self, 
        user_id: str, 
        novel_cover_image_url: str | None, 
        novel_name: str | None, 
        novel_summary: str | None
    ) -> NovelSQLEntity:
        novel = NovelSQLEntity(
            user_id=user_id,
            novel_cover_image_url=novel_cover_image_url or "",
            novel_name=novel_name or "未命名小说",
            novel_summary=novel_summary or ""
        )
        self.session.add(novel)
        await self.session.flush()
        return novel

    async def get_user_active_novels_with_word_count(self, user_id: str) -> List[Tuple[NovelSQLEntity, int]]:
        """Get active novels for user with total word count."""
        # For now, let's just return novels and 0.
        statement = select(NovelSQLEntity).where(
            NovelSQLEntity.user_id == user_id, 
            NovelSQLEntity.novel_is_remove == False
        )
        result = await self.session.execute(statement)
        novels = result.scalars().all()
        return [(n, 0) for n in novels]

    # Folder Methods
    async def create_folder(self, novel_id: str, folder_name: str) -> FolderSQLEntity:
        folder = FolderSQLEntity(novel_id=novel_id, folder_name=folder_name)
        self.session.add(folder)
        await self.session.flush()
        return folder

    async def delete_folder_by_id(self, folder_id: str):
        statement = delete(FolderSQLEntity).where(FolderSQLEntity.folder_id == folder_id)
        await self.session.execute(statement)

    async def update_folder_name(self, folder_id: str, folder_name: str):
        statement = update(FolderSQLEntity).where(FolderSQLEntity.folder_id == folder_id).values(folder_name=folder_name)
        await self.session.execute(statement)

    # Document Methods
    async def create_document_metadata(
        self, 
        user_id: str, 
        novel_id: str, 
        document_title: str,
        document_current_version_id: str,
        folder_id: str | None = None
    ) -> DocumentMetadataSQLEntity:
        doc = DocumentMetadataSQLEntity(
            user_id=user_id, 
            novel_id=novel_id, 
            document_title=document_title, 
            document_current_version_id=document_current_version_id,
            folder_id=folder_id
        )
        self.session.add(doc)
        await self.session.flush()
        return doc
        
    async def create_document_version(self, document_id: str, document_body_text: str) -> DocumentVersionSQLEntity:
        version = DocumentVersionSQLEntity(document_id=document_id, document_body_text=document_body_text)
        self.session.add(version)
        await self.session.flush()
        return version

    async def update_document_current_version_id(self, document_id: str, version_id: str):
        statement = update(DocumentMetadataSQLEntity).where(
            DocumentMetadataSQLEntity.document_id == document_id
        ).values(document_current_version_id=version_id)
        await self.session.execute(statement)

    async def update_document_title(self, document_id: str, document_title: str):
        statement = update(DocumentMetadataSQLEntity).where(
            DocumentMetadataSQLEntity.document_id == document_id
        ).values(document_title=document_title)
        await self.session.execute(statement)
    
    async def soft_delete_document_by_id(self, document_id: str):
        statement = update(DocumentMetadataSQLEntity).where(
            DocumentMetadataSQLEntity.document_id == document_id
        ).values(document_is_remove=True)
        await self.session.execute(statement)

    async def get_document_by_doc_id(self, document_id: str) -> Optional[DocumentMetadataSQLEntity]:
        statement = select(DocumentMetadataSQLEntity).where(DocumentMetadataSQLEntity.document_id == document_id)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_document_version_by_doc_id_and_version_id(self, document_id: str, document_version_id: str) -> Optional[DocumentVersionSQLEntity]:
        statement = select(DocumentVersionSQLEntity).where(
            DocumentVersionSQLEntity.document_id == document_id,
            DocumentVersionSQLEntity.document_version_id == document_version_id
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_document_versions_by_doc_id(self, document_id: str) -> List[DocumentVersionSQLEntity]:
        statement = select(DocumentVersionSQLEntity).where(DocumentVersionSQLEntity.document_id == document_id)
        result = await self.session.execute(statement)
        return result.scalars().all()

    # Tree Sort Methods
    async def create_tree_sort(
        self, 
        novel_id: str, 
        node_type: str, 
        node_id: str, 
        parent_id: str | None = None
    ) -> TreeSortSQLEntity:
        # Get max sort order
        statement = select(func.max(TreeSortSQLEntity.node_sort_order)).where(
            TreeSortSQLEntity.novel_id == novel_id,
            TreeSortSQLEntity.parent_id == parent_id
        )
        result = await self.session.execute(statement)
        max_order = result.scalar()
        new_order = (max_order or 0) + 1
        
        tree_sort = TreeSortSQLEntity(
            novel_id=novel_id,
            node_type=node_type,
            node_id=node_id,
            parent_id=parent_id,
            node_sort_order=new_order
        )
        self.session.add(tree_sort)
        await self.session.flush()
        return tree_sort

    async def delete_tree_sort_by_node_id(self, node_id: str, node_type: str):
        statement = delete(TreeSortSQLEntity).where(
            TreeSortSQLEntity.node_id == node_id,
            TreeSortSQLEntity.node_type == node_type
        )
        await self.session.execute(statement)
        
    async def get_novel_directory_elements(self, novel_id: str):
        # Fetch tree items
        tree_stmt = select(TreeSortSQLEntity).where(TreeSortSQLEntity.novel_id == novel_id)
        tree_result = await self.session.execute(tree_stmt)
        tree_items = tree_result.scalars().all()
        
        # Fetch folders
        folder_stmt = select(FolderSQLEntity).where(FolderSQLEntity.novel_id == novel_id)
        folder_result = await self.session.execute(folder_stmt)
        folder_map = {f.folder_id: f for f in folder_result.scalars().all()}
        
        # Fetch documents
        doc_stmt = select(
            DocumentMetadataSQLEntity,
            DocumentVersionSQLEntity.document_word_count
        ).outerjoin(
            DocumentVersionSQLEntity,
            DocumentVersionSQLEntity.document_version_id == DocumentMetadataSQLEntity.document_current_version_id
        ).where(
            DocumentMetadataSQLEntity.novel_id == novel_id,
            DocumentMetadataSQLEntity.document_is_remove == False
        )
        doc_result = await self.session.execute(doc_stmt)
        
        doc_map = {row[0].document_id: (row[0], row[1] or 0) for row in doc_result.all()}
        
        return tree_items, folder_map, doc_map
