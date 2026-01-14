import logging

from typing import List, Dict, Union, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel,Field

from services.user_service import check_user_exist_by_user_id4service
from core.domain.models import (
    DocumentDetailPinnedVersion,
    DirectoryNode
    )

from common.clients.pg import pg_client
from common.clients.pg.pg_client import PGClient
from common.clients.pg.pg_models import (
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

from typing import Union


# 创建文件夹。
async def create_folder4service(
    user_id: str, 
    novel_id: str, 
    folder_name: str, 
    session: AsyncSession
) -> DirectoryNode:
    """创建文件夹。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        name: str, # 文件夹名
    """
    await check_user_exist_by_user_id4service(user_id=user_id,session=session)

    pg_client = PGClient(session)
    folder=await pg_client.create_folder(
        novel_id=novel_id,
        folder_name=folder_name,
    )
    # 创建节点关联
    tree_sort=await pg_client.create_tree_sort(
        novel_id=novel_id,
        node_type="folder",
        node_id=folder.folder_id,
    )
    directory_node=DirectoryNode(
        node_id=folder.folder_id,
        node_name=folder_name,
        node_type="folder",
        sort_order=tree_sort.node_sort_order
    )
    await session.commit()
    return directory_node
async def delete_folder4service(
    user_id: str, 
    novel_id: str, 
    folder_id: str,
    session: AsyncSession
) -> bool:
    """删除文件夹。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        folder_id: str, # 文件夹ID
    """
    await check_user_exist_by_user_id4service(user_id=user_id,session=session)

    pg_client = PGClient(session)
    # 删除文件夹
    await pg_client.delete_folder_by_id(folder_id=folder_id)
    # 删除节点关联
    await pg_client.delete_tree_sort_by_node_id(node_id=folder_id, node_type="folder")
    
    await session.commit()
    return True

async def rename_folder4service(
    user_id: str,
    novel_id: str,
    folder_id: str,
    folder_name: str,
    session: AsyncSession
) -> str:
    """重命名文件夹"""
    await check_user_exist_by_user_id4service(user_id=user_id, session=session)
    pg_client = PGClient(session)
    await pg_client.update_folder_name(folder_id=folder_id, folder_name=folder_name)
    await session.commit()
    return folder_name

async def rename_document4service(
    user_id: str,
    document_id: str,
    document_title: str,
    session: AsyncSession
) -> str:
    """重命名文档"""
    await check_user_exist_by_user_id4service(user_id=user_id, session=session)
    pg_client = PGClient(session)
    await pg_client.update_document_title(document_id=document_id, document_title=document_title)
    await session.commit()
    return document_title

async def update_document_content4service(
    user_id: str,
    document_id: str,
    content: str,
    session: AsyncSession
) -> str:
    """更新文档内容（创建新版本）"""
    await check_user_exist_by_user_id4service(user_id=user_id, session=session)
    pg_client = PGClient(session)
    
    # 1. 创建新版本
    doc_version = await pg_client.create_document_version(
        document_id=document_id,
        document_body_text=content
    )
    
    # 2. 更新元数据的当前版本ID
    await pg_client.update_document_current_version_id(
        document_id=document_id,
        version_id=doc_version.document_version_id
    )
    document_version_id=doc_version.document_version_id
    await session.commit()
    return document_version_id

async def create_document4service(
    user_id: str,
    novel_id: str,
    folder_id: str | None,
    document_title: str,
    session: AsyncSession
) -> DirectoryNode:
    """创建文档"""
    await check_user_exist_by_user_id4service(user_id=user_id, session=session)
    pg_client = PGClient(session)
    
    # 1. 创建文档元数据，先使用空字符串作为版本ID占位（假设DB允许或我们稍后立即更新）
    # 注意：如果 document_current_version_id 有外键约束且不可为空，这里会失败。
    # 假设 document_current_version_id 没有强外键约束或者允许为空字符串（虽然通常设计为FK）。
    # 如果有FK，我们需要先生成 version，但 version 需要 doc_id。
    # 这里的解决方案通常是：允许 document_current_version_id 为 nullable，或者在事务中延迟检查。
    # 鉴于我们无法修改 schema，我们尝试传入空字符串（如果允许）或临时值。
    # 如果失败，说明架构设计需要调整（例如允许 null）。
    # 我们假设它允许为空或者暂时不检查。
    
    doc_metadata = await pg_client.create_document_metadata(
        user_id=user_id,
        novel_id=novel_id,
        document_title=document_title,
        document_current_version_id="", # 占位
        folder_id=folder_id
    )
    
    # 2. 创建初始版本
    doc_version = await pg_client.create_document_version(
        document_id=doc_metadata.document_id,
        document_body_text=""
    )
    
    # 3. 更新元数据的当前版本ID
    await pg_client.update_document_current_version_id(
        document_id=doc_metadata.document_id,
        version_id=doc_version.document_version_id
    )
    
    # 4. 创建节点关联
    tree_sort = await pg_client.create_tree_sort(
        novel_id=novel_id,
        node_type="document",
        node_id=doc_metadata.document_id,
        parent_id=folder_id
    )
    directory_node=DirectoryNode(
        node_id=doc_metadata.document_id,
        node_name=document_title,
        node_type="document",
        sort_order=tree_sort.node_sort_order
    )
    await session.commit()
    
    return directory_node

# 可在小说章节(文档)编辑处使用
# 可在小说创作助手Agent中使用
async def get_document_detail_use_document_id_and_version_id4service(doc_id:str,version_id:str,session: AsyncSession)->DocumentDetailPinnedVersion:
    """根据文档ID和版本ID获取文档详情"""
    pg_client = PGClient(session)
    document_version=await pg_client.get_document_version_by_doc_id_and_version_id(document_id=doc_id,document_version_id=version_id)
    if not document_version:
        raise DocumentNotFoundError(f"文档版本 {version_id} 不存在")
    document=await pg_client.get_document_by_doc_id(document_id=doc_id)
    if not document:
        raise DocumentNotFoundError(f"文档 {doc_id} 不存在")
    
    document_version_data = document_version.__dict__
    document_data = document.__dict__
    
    merged_data = {**document_version_data, **document_data}
    return DocumentDetailPinnedVersion(**merged_data)
  

async def get_document_detail4service(document_id: str, session: AsyncSession) -> DocumentDetailPinnedVersion:
    """获取文档详情（最新版本）"""
    pg_client = PGClient(session)
    document = await pg_client.get_document_by_doc_id(document_id=document_id)
    if not document:
        raise DocumentNotFoundError(f"文档 {document_id} 不存在")
    
    version_id = document.document_current_version_id
    return await get_document_detail_use_document_id_and_version_id4service(
        doc_id=document_id,
        version_id=version_id,
        session=session
    )

# 可在编辑页面查看指定文档下有哪些版本,可进一步进行切换。
# 版本还是线性的比较好开发点...
async def get_document_version_list(doc_id:str)->list:
    pass

async def get_document_versions4service(document_id: str, session: AsyncSession) -> List[DocumentVersionSQLEntity]:
    """获取文档版本列表"""
    pg_client = PGClient(session)
    return await pg_client.get_document_versions_by_doc_id(document_id=document_id)

async def delete_document4service(
    user_id: str,
    novel_id: str,
    document_id: str,
    session: AsyncSession
) -> bool:
    """删除文档（软删除）"""
    await check_user_exist_by_user_id4service(user_id=user_id, session=session)
    pg_client = PGClient(session)
    
    # 软删除文档元数据
    await pg_client.soft_delete_document_by_id(document_id=document_id)
    
    # 删除节点关联（从目录中移除）
    await session.commit()
    await pg_client.delete_tree_sort_by_node_id(node_id=document_id, node_type="document")
    
    return True

# class TableOfContentsEntity(BaseModel):
#     """目录项."""
#     doc_id: str = Field(description="文档ID")
#     title: str = Field(description="文档名称")
#     current_version_id: str = Field(description="文档版本")
#     version_list: List[str] = Field(description="文档版本列表")
    
# class FolderEntity(BaseModel):
#     """文件夹实体."""
#     folder_id: str = Field(description="文件夹ID")
#     folder_name: str = Field(description="文件夹名称")
#     create_time: str = Field(description="创建时间")
#     table_of_contents: List[TableOfContentsEntity] = Field(description="目录项列表")

# def _transform_to_folder_entity(folder: FolderSQLEntity, children: List[Union[FolderEntity, TableOfContentsEntity]]) -> FolderEntity:
#     """数据转换: FolderSQLEntity + children -> FolderEntity"""
#     folder_data = folder.__dict__
#     return FolderEntity(
#         **folder_data,
#         table_of_contents=children
#     )

# def _transform_to_toc_entity(document: DocumentSQLEntity) -> TableOfContentsEntity:
#     """数据转换: DocumentSQLEntity -> TableOfContentsEntity"""
#     doc_data = document.__dict__
#     return TableOfContentsEntity(version_list=[], **doc_data)

# async def get_novel_table4service(novel_id:str,session: AsyncSession)->List[Union[TableOfContentsEntity,FolderEntity]]:
#     """获取小说目录"""
#     pg_client = PGClient(session)
#     # 1. 获取小说的目录结构
#     table_struct:List[TreeSortSQLEntity]=pg_client.get_novel_tree_sorts_by_novel_id(novel_id=novel_id)
#     # 2. 获取小说的文件夹(卷)数据
#     folder=await pg_client.get_novel_folders(novel_id=novel_id)
#     # 3. 获取小说的文档(章节)数据
#     document=await pg_client.get_novel_document_list_by_novel_id(novel_id=novel_id)
#     # 4 根据 目录结构进行组合排序，
#     # 4.1 先把所有节点按父节点分组，并各自按 sort_order 排序
#     parent_map: Dict[Optional[str], List[TreeSortSQLEntity]] = {}
#     for node in table_struct:
#         parent_map.setdefault(node.parent_id, []).append(node)
#     for nodes in parent_map.values():
#         nodes.sort(key=lambda x: x.sort_order)

#     # 4.2 收集所有“根级”节点（parent_id 为 None）
#     root_nodes = parent_map.get(None, [])

#     # 4.3 分离根级的 folder 与 document
#     root_folders = [n for n in root_nodes if n.node_type == "folder"]
#     root_docs = [n for n in root_nodes if n.node_type == "document"]  # 即 document

#     # 4.4 文件夹内部递归排序：先排文件夹，再排其直属文档
#     def build_sorted_children(parent_id: str) -> List[Union[FolderEntity, TableOfContentsEntity]]:
#         children = parent_map.get(parent_id, [])
#         # 分离当前层级下的 folder 与 document
#         folders_here = [n for n in children if n.node_type == "folder"]
#         docs_here = [n for n in children if n.node_type == "document"]

#         result: List[Union[FolderEntity, TableOfContentsEntity]] = []
#         # 先加文件夹（已按 sort_order 排好）
#         for f_node in folders_here:
#             folder_sql:FolderSQLEntity = next((f for f in folder if f.folder_id == f_node.node_id), None)
#             if folder_sql:
#                 sub = build_sorted_children(f_node.node_id)
#                 result.append(_transform_to_folder_entity(folder_sql, sub))
#         # 再加该文件夹下的文档（已按 sort_order 排好）
#         for d_node in docs_here:
#             doc_sql:DocumentSQLEntity = next((d for d in document if d.doc_id == d_node.node_id), None)
#             if doc_sql:
#                 result.append(_transform_to_toc_entity(doc_sql))
#         return result

#     # 4.5 组装最终目录：先所有根级文件夹（内部已递归），再排所有裸露的根级文档
#     toc: List[Union[TableOfContentsEntity, FolderEntity]] = []
#     for rf in root_folders:
#         folder_sql = next((f for f in folder if f.folder_id == rf.node_id), None)
#         if folder_sql:
#             sub = build_sorted_children(rf.node_id)
#             toc.append(_transform_to_folder_entity(folder_sql, sub))
#     # 根级文档排在最后
#     for rd in root_docs:
#         doc_sql:DocumentSQLEntity = next((d for d in document if d.doc_id == rd.node_id), None)
#         if doc_sql:
#             toc.append(_transform_to_toc_entity(doc_sql))

#     return toc
