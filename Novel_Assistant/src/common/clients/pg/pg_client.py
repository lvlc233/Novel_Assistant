# import asyncio
# from typing import List, Optional
# from sqlmodel import select
# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
# from common.clients.pg.pg_model import (
#     DocumentEntity, 
#     DocumentVersionEntity, 
#     NovelEntity, 
#     FolderEntity, 
#     TreeSortEntity, 
#     UserEntity
# )
# import os

# engine = create_async_engine(os.getenv("DATABASE_URL"), echo=True, future=True)

# async def get_session() -> AsyncSession:
#     async with AsyncSession(engine) as session:
#         yield session

# class PGClient:
#     def __init__(self, session: AsyncSession):
#         self.session = session
    
#     # --- 用户相关 ---
#     async def create_user(self, user: UserEntity) -> UserEntity:
#         self.session.add(user)
#         await self.session.commit()
#         await self.session.refresh(user)
#         return user

#     async def get_user(self, user_id: str) -> Optional[UserEntity]:
#         return await self.session.get(UserEntity, user_id)

#     async def get_user_by_name(self, name: str) -> Optional[UserEntity]:    
#         statement = select(UserEntity).where(UserEntity.name == name)
#         result = await self.session.execute(statement)
#         return result.scalars().first()

#     # --- 小说相关 ---
#     async def create_novel(self, user_id: str, novel_name: str|None=None, description: str|None=None) -> NovelEntity:
#         novel = NovelEntity(user_id=user_id, name=novel_name, description=description)
#         self.session.add(novel) 
#         await self.session.commit()
#         await self.session.refresh(novel)
#         return novel

#     async def get_existing_novel_list(self, user_id: str) -> List[NovelEntity]: 
#         statement = select(NovelEntity).where(
#             NovelEntity.user_id == user_id, 
#             NovelEntity.is_remove == False
#         )
#         result = await self.session.execute(statement)
#         return result.scalars().all()

#     async def get_removed_novel_list(self, user_id: str) -> List[NovelEntity]:
#         statement = select(NovelEntity).where(
#             NovelEntity.user_id == user_id, 
#             NovelEntity.is_remove == True
#         )
#         result = await self.session.execute(statement)
#         return result.scalars().all()     

#     async def get_novel_details(self, novel_id: str) -> NovelEntity|None:
#         """获取小说详情"""
#         novel = await self.session.get(NovelEntity, novel_id)
#         document, folder, tree_sort = await asyncio.gather(
#             self.session.get(DocumentEntity, novel_id=novel_id),
#             self.session.get(FolderEntity, novel_id=novel_id),
#             self.session.get(TreeSortEntity, novel_id=novel_id),
#         )

#         if not novel:
            


#     async def delete_novel(self, novel_id: str) -> bool:
#         """删除小说"""
#         novel = await self.session.get(NovelEntity, novel_id)
#         if novel:
#             novel.is_remove = True
#             self.session.add(novel)
#             await self.session.commit()
#             return True
#         return False

#     # --- 文档相关 ---
#     async def create_document(self, document: DocmentEntity) -> DocmentEntity:
#         self.session.add(document)
#         await self.session.commit()
#         await self.session.refresh(document)     
#         return document

#     async def get_document(self, doc_id: str) -> Optional[DocmentEntity]:
#         return await self.session.get(DocmentEntity, doc_id)

#     async def update_document(self, document: DocmentEntity) -> DocmentEntity:
#         self.session.add(document)
#         await self.session.commit()
#         await self.session.refresh(document)
#         return document

#     async def delete_document(self, doc_id: str) -> bool:
#         document = await self.session.get(DocmentEntity, doc_id)
#         if document:
#             document.is_remove = True
#             self.session.add(document)
#             await self.session.commit()
#             return True
#         return False

#     # --- 文档版本 ---
#     async def create_document_version(self, version: DocmentVersionEntity) -> DocmentVersionEntity:
#         self.session.add(version)
#         await self.session.commit()
#         await self.session.refresh(version)
#         return version

#     async def get_document_version(self, version_id: str) -> Optional[DocmentVersionEntity]:
#         return await self.session.get(DocmentVersionEntity, version_id)
    
#     async def list_document_versions(self, doc_id: str) -> List[DocmentVersionEntity]:  
#         statement = select(DocmentVersionEntity).where(DocmentVersionEntity.doc_id == doc_id).order_by(DocmentVersionEntity.create_time.desc())
#         return await self.session.exec(statement).all()

#     # --- 文件夹 ---
#     async def create_folder(self, folder: FolderEntity) -> FolderEntity:
#         self.session.add(folder)
#         await self.session.commit()
#         await self.session.refresh(folder)
#         return folder
    
#     async def get_folder(self, folder_id: str) -> Optional[FolderEntity]:
#         return await self.session.get(FolderEntity, folder_id)   

#     async def list_folders(self, novel_id: str) -> List[FolderEntity]:
#         statement = select(FolderEntity).where(FolderEntity.novel_id == novel_id)
#         return await self.session.exec(statement).all()  

#     # --- 层次结构 ---
#     async def add_tree_node(self, node: TreeSortEntity) -> TreeSortEntity:
#         self.session.add(node)
#         await self.session.commit()
#         await self.session.refresh(node)
#         return node

#     async def get_novel_tree(self, novel_id: str) -> List[TreeSortEntity]:
#         statement = select(TreeSortEntity).where(TreeSortEntity.novel_id == novel_id).order_by(TreeSortEntity.sort_order)
#         return await self.session.exec(statement).all()
            
#     async def update_tree_node(self, node: TreeSortEntity) -> TreeSortEntity:
#         self.session.add(node)
#         await self.session.commit()
#         await self.session.refresh(node) 
#         return node

#     async def delete_tree_node(self, tree_id: str) -> bool:
#         node = await self.session.get(TreeSortEntity, tree_id)
#         if node:
#             await self.session.delete(node)
#             await self.session.commit()
#             return True
#         return False
