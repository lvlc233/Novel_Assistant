
from typing import List, Dict, Union, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from common.log.log import logger
from services.user.service import check_user_exist_by_user_id4service
from api.routes.document.schema import (
    DocumentDetailResponse,
    DirectoryNodeResponse
    )

from infrastructure.pg.pg_client import PGClient
from infrastructure.pg.pg_models import (
    FolderSQLEntity, 
    TreeSortSQLEntity,
    # DocumentSQLEntity,
    DocumentMetadataSQLEntity,
    DocumentVersionSQLEntity
)

from common.errors import (
    UserNotFoundError,
    NovelNotFoundError,
    DocumentNotFoundError,
)

class DocumentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.pg_client = PGClient(session)

    async def create_folder(self, user_id: str, novel_id: str, folder_name: str) -> DirectoryNodeResponse:
        """创建文件夹"""
        try:
            await check_user_exist_by_user_id4service(user_id=user_id, session=self.session)

            folder = await self.pg_client.create_folder(
                novel_id=novel_id,
                folder_name=folder_name,
            )
            # 创建节点关联
            tree_sort = await self.pg_client.create_tree_sort(
                novel_id=novel_id,
                node_type="folder",
                node_id=folder.folder_id,
            )
            directory_node = DirectoryNodeResponse(
                node_id=folder.folder_id,
                node_name=folder_name,
                node_type="folder",
                sort_order=tree_sort.node_sort_order
            )
            await self.session.commit()
            return directory_node
        except Exception as e:
            logger.error(f"创建文件夹失败: {e}")
            raise e

    async def delete_folder(self, user_id: str, novel_id: str, folder_id: str) -> bool:
        """删除文件夹"""
        try:
            await check_user_exist_by_user_id4service(user_id=user_id, session=self.session)

            # 删除文件夹
            await self.pg_client.delete_folder_by_id(folder_id=folder_id)
            # 删除节点关联
            await self.pg_client.delete_tree_sort_by_node_id(node_id=folder_id, node_type="folder")
            
            await self.session.commit()
            return True
        except Exception as e:
            logger.error(f"删除文件夹失败: {e}")
            raise e

    async def rename_folder(self, user_id: str, novel_id: str, folder_id: str, folder_name: str) -> str:
        """重命名文件夹"""
        try:
            await check_user_exist_by_user_id4service(user_id=user_id, session=self.session)
            await self.pg_client.update_folder_name(folder_id=folder_id, folder_name=folder_name)
            await self.session.commit()
            return folder_name
        except Exception as e:
            logger.error(f"重命名文件夹失败: {e}")
            raise e

    async def rename_document(self, user_id: str, document_id: str, document_title: str) -> str:
        """重命名文档"""
        try:
            await check_user_exist_by_user_id4service(user_id=user_id, session=self.session)
            await self.pg_client.update_document_title(document_id=document_id, document_title=document_title)
            await self.session.commit()
            return document_title
        except Exception as e:
            logger.error(f"重命名文档失败: {e}")
            raise e

    async def update_document_content(self, user_id: str, document_id: str, content: str) -> str:
        """更新文档内容（创建新版本）"""
        try:
            await check_user_exist_by_user_id4service(user_id=user_id, session=self.session)
            
            # 1. 创建新版本
            doc_version = await self.pg_client.create_document_version(
                document_id=document_id,
                document_body_text=content
            )
            
            # 2. 更新元数据的当前版本ID
            await self.pg_client.update_document_current_version_id(
                document_id=document_id,
                version_id=doc_version.document_version_id
            )
            document_version_id = doc_version.document_version_id
            await self.session.commit()
            return document_version_id
        except Exception as e:
            logger.error(f"更新文档内容失败: {e}")
            raise e

    async def create_document(self, user_id: str, novel_id: str, folder_id: str | None, document_title: str) -> DirectoryNodeResponse:
        """创建文档"""
        try:
            await check_user_exist_by_user_id4service(user_id=user_id, session=self.session)
            
            # 1. 创建文档元数据
            doc_metadata = await self.pg_client.create_document_metadata(
                user_id=user_id,
                novel_id=novel_id,
                document_title=document_title,
                document_current_version_id="", # 占位
                folder_id=folder_id
            )
            
            # 2. 创建初始版本
            doc_version = await self.pg_client.create_document_version(
                document_id=doc_metadata.document_id,
                document_body_text=""
            )
            
            # 3. 更新元数据的当前版本ID
            await self.pg_client.update_document_current_version_id(
                document_id=doc_metadata.document_id,
                version_id=doc_version.document_version_id
            )
            
            # 4. 创建节点关联
            tree_sort = await self.pg_client.create_tree_sort(
                novel_id=novel_id,
                node_type="document",
                node_id=doc_metadata.document_id,
                parent_id=folder_id
            )
            directory_node = DirectoryNodeResponse(
                node_id=doc_metadata.document_id,
                node_name=document_title,
                node_type="document",
                sort_order=tree_sort.node_sort_order
            )
            await self.session.commit()
            
            return directory_node
        except Exception as e:
            logger.error(f"创建文档失败: {e}")
            raise e

    async def get_document_detail_with_version(self, doc_id: str, version_id: str) -> DocumentDetailResponse:
        """根据文档ID和版本ID获取文档详情"""
        try:
            document_version = await self.pg_client.get_document_version_by_doc_id_and_version_id(document_id=doc_id, document_version_id=version_id)
            if not document_version:
                raise DocumentNotFoundError(f"文档版本 {version_id} 不存在")
            document = await self.pg_client.get_document_by_doc_id(document_id=doc_id)
            if not document:
                raise DocumentNotFoundError(f"文档 {doc_id} 不存在")
            
            document_version_data = document_version.__dict__
            document_data = document.__dict__
            
            merged_data = {**document_version_data, **document_data}
            # TODO: 这里的数据模型的创建可以考虑用那个pydantic的model_vel?什么的,然后用configDict进行映射进行对象支持怎么样?这样子的做法好像比较好,这个项目之前写的时候比较生所以用了现在这种方式,其他地方好像也是。
            return DocumentDetailResponse(**merged_data)
        except Exception as e:
            logger.error(f"获取文档版本详情失败: {e}")
            raise e
      
    async def get_document_detail(self, document_id: str) -> DocumentDetailResponse:
        """获取文档详情（最新版本）"""
        try:
            document = await self.pg_client.get_document_by_doc_id(document_id=document_id)
            if not document:
                raise DocumentNotFoundError(f"文档 {document_id} 不存在")
            
            version_id = document.document_current_version_id
            return await self.get_document_detail_with_version(
                doc_id=document_id,
                version_id=version_id
            )
        except Exception as e:
            logger.error(f"获取文档详情失败: {e}")
            raise e

    async def get_document_versions(self, document_id: str) -> List[DocumentVersionSQLEntity]:
        """获取文档版本列表"""
        try:
            return await self.pg_client.get_document_versions_by_doc_id(document_id=document_id)
        except Exception as e:
            logger.error(f"获取文档版本列表失败: {e}")
            raise e

    async def delete_document(self, user_id: str, novel_id: str, document_id: str) -> bool:
        """删除文档（软删除）"""
        try:
            await check_user_exist_by_user_id4service(user_id=user_id, session=self.session)
            
            # 软删除文档元数据
            await self.pg_client.soft_delete_document_by_id(document_id=document_id)
            
            # 删除节点关联（从目录中移除）
            await self.session.commit()
            await self.pg_client.delete_tree_sort_by_node_id(node_id=document_id, node_type="document")
            
            return True
        except Exception as e:
            logger.error(f"删除文档失败: {e}")
            raise e
