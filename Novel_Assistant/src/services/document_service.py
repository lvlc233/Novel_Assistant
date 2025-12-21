import logging

from typing import List, Dict, Union, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel,Field

from common.clients.pg import pg_client
from common.clients.pg.pg_client import PGClient
from common.clients.pg.pg_models import (
    FolderSQLEntity, 
    DocumentSQLEntity, 
    DocumentVersionSQLEntity, 
    TreeSortSQLEntity,
    
)

from common.err import (
    UserNotFoundError,
    NovelNotFoundError,
    DocumentNotFoundError,
)
from common.adapter.novel import (
    NovelAdapter, 
    FolderAdapter, 
    TableOfContentsEntityAdapter,
    DocumentAdapter
)    
from core.domain.models import (
    NovelDomain, 
    DocumentDomain,

)
from typing import Union


# async def 
class DocumentDetailPinnedVersion(BaseModel):
    """指定版本的文档详情。
    """
    doc_id: str = Field(description="文档ID")
    version_id: str = Field(description="版本ID")
    title: str = Field(description="文档标题")
    body_text: str | None = Field(default=None,description="文档内容")
    word_count: int = Field(default=0,description="字数")

def _transform_to_document_detail(document: DocumentSQLEntity, document_version: DocumentVersionSQLEntity) -> DocumentDetailPinnedVersion:
    """数据转换: DocumentSQLEntity + DocumentVersionSQLEntity -> DocumentDetailPinnedVersion"""
    document_version_data = document_version.__dict__
    document_data = document.__dict__
    
    merged_data = {**document_version_data, **document_data}
    return DocumentDetailPinnedVersion(**merged_data)

# 可在小说章节(文档)编辑处使用
# 可在小说创作助手Agent中使用
async def get_document_detail_use_document_id_and_version_id4service(doc_id:str,version_id:str,session: AsyncSession)->DocumentDetailPinnedVersion:
    """根据文档ID和版本ID获取文档详情"""
    pg_client = PGClient(session)
    document_version=pg_client.get_document_version_by_doc_id_and_version_id(doc_id=doc_id,version_id=version_id)
    document=pg_client.get_document_by_doc_id(doc_id=doc_id)
    
    return _transform_to_document_detail(document, document_version)
  

# 可在编辑页面查看指定文档下有哪些版本,可进一步进行切换。
# 版本还是线性的比较好开发点...
async def get_document_version_list(doc_id:str)->list:
    pass


class TableOfContentsEntity(BaseModel):
    """目录项."""
    doc_id: str = Field(description="文档ID")
    title: str = Field(description="文档名称")
    current_version_id: str = Field(description="文档版本")
    version_list: List[str] = Field(description="文档版本列表")
    
class FolderEntity(BaseModel):
    """文件夹实体."""
    folder_id: str = Field(description="文件夹ID")
    folder_name: str = Field(description="文件夹名称")
    create_time: str = Field(description="创建时间")
    table_of_contents: List[TableOfContentsEntity] = Field(description="目录项列表")

def _transform_to_folder_entity(folder: FolderSQLEntity, children: List[Union[FolderEntity, TableOfContentsEntity]]) -> FolderEntity:
    """数据转换: FolderSQLEntity + children -> FolderEntity"""
    folder_data = folder.__dict__
    return FolderEntity(
        **folder_data,
        table_of_contents=children
    )

def _transform_to_toc_entity(document: DocumentSQLEntity) -> TableOfContentsEntity:
    """数据转换: DocumentSQLEntity -> TableOfContentsEntity"""
    doc_data = document.__dict__
    return TableOfContentsEntity(version_list=[], **doc_data)

async def get_novel_table4service(novel_id:str,session: AsyncSession)->List[Union[TableOfContentsEntity,FolderEntity]]:
    """获取小说目录"""
    pg_client = PGClient(session)
    # 1. 获取小说的目录结构
    table_struct:List[TreeSortSQLEntity]=pg_client.get_novel_tree_sorts_by_novel_id(novel_id=novel_id)
    # 2. 获取小说的文件夹(卷)数据
    folder=pg_client.get_novel_folders(novel_id=novel_id)
    # 3. 获取小说的文档(章节)数据
    document=pg_client.get_novel_document_list_by_novel_id(novel_id=novel_id)
    # 4 根据 目录结构进行组合排序，
    # 4.1 先把所有节点按父节点分组，并各自按 sort_order 排序
    parent_map: Dict[Optional[str], List[TreeSortSQLEntity]] = {}
    for node in table_struct:
        parent_map.setdefault(node.parent_id, []).append(node)
    for nodes in parent_map.values():
        nodes.sort(key=lambda x: x.sort_order)

    # 4.2 收集所有“根级”节点（parent_id 为 None）
    root_nodes = parent_map.get(None, [])

    # 4.3 分离根级的 folder 与 document
    root_folders = [n for n in root_nodes if n.node_type == "folder"]
    root_docs = [n for n in root_nodes if n.node_type == "document"]  # 即 document

    # 4.4 文件夹内部递归排序：先排文件夹，再排其直属文档
    def build_sorted_children(parent_id: str) -> List[Union[FolderEntity, TableOfContentsEntity]]:
        children = parent_map.get(parent_id, [])
        # 分离当前层级下的 folder 与 document
        folders_here = [n for n in children if n.node_type == "folder"]
        docs_here = [n for n in children if n.node_type == "document"]

        result: List[Union[FolderEntity, TableOfContentsEntity]] = []
        # 先加文件夹（已按 sort_order 排好）
        for f_node in folders_here:
            folder_sql:FolderSQLEntity = next((f for f in folder if f.folder_id == f_node.node_id), None)
            if folder_sql:
                sub = build_sorted_children(f_node.node_id)
                result.append(_transform_to_folder_entity(folder_sql, sub))
        # 再加该文件夹下的文档（已按 sort_order 排好）
        for d_node in docs_here:
            doc_sql:DocumentSQLEntity = next((d for d in document if d.doc_id == d_node.node_id), None)
            if doc_sql:
                result.append(_transform_to_toc_entity(doc_sql))
        return result

    # 4.5 组装最终目录：先所有根级文件夹（内部已递归），再排所有裸露的根级文档
    toc: List[Union[TableOfContentsEntity, FolderEntity]] = []
    for rf in root_folders:
        folder_sql = next((f for f in folder if f.folder_id == rf.node_id), None)
        if folder_sql:
            sub = build_sorted_children(rf.node_id)
            toc.append(_transform_to_folder_entity(folder_sql, sub))
    # 根级文档排在最后
    for rd in root_docs:
        doc_sql:DocumentSQLEntity = next((d for d in document if d.doc_id == rd.node_id), None)
        if doc_sql:
            toc.append(_transform_to_toc_entity(doc_sql))

    return toc














# old
async def create_novel4service(user_id: str, name: str, summary: str, session: AsyncSession) -> str:
    """创建小说"""
    pg_client = PGClient(session)
    try:
        if not await pg_client.check_user_exist_by_id(user_id):
            raise UserNotFoundError(f"用户ID {user_id} 不存在")
        novel = await pg_client.create_novel(user_id, name, summary)
        novel_id = novel.novel_id
        await session.commit()
        return novel_id
    except Exception as e:
        logging.error(f"创建小说失败: {e}")
        await session.rollback()
        raise e


async def get_novel_existing_list4service(user_id: str, session: AsyncSession) -> List[NovelDomain]:
    """根据用户ID获取小说列表"""
    pg_client = PGClient(session)
    try:
        if not await pg_client.check_user_exist_by_id(user_id):
            raise UserNotFoundError(f"用户ID {user_id} 不存在")
        novels_db = await pg_client.get_user_active_novels(user_id)
        novels = []
        for novel_db in novels_db:
            novel = NovelAdapter.to_domain(novel_db)
            novels.append(novel)
        return novels
    except Exception as e:
        logging.error(f"获取存在小说列表失败: {e}")
        raise e

async def delete_novel4service(novel_id: str, session: AsyncSession) -> bool:
    """删除小说"""
    pg_client = PGClient(session)
    try:
        if not await pg_client.check_novel_exist_by_id(novel_id):
            raise NovelNotFoundError(novel_id)
            
        await pg_client.delete_novel(novel_id)
        await session.commit()
        return True
    except Exception as e:
        logging.error(f"删除小说失败: {e}")
        await session.rollback()
        raise e

async def update_novel_info4service(novel_id: str, name: str | None, summary: str | None, session: AsyncSession) -> bool:
    """修改小说信息"""
    pg_client = PGClient(session)
    try:
        if not await pg_client.check_novel_exist_by_id(novel_id):
            raise NovelNotFoundError(novel_id)
        
        result = await pg_client.update_novel(novel_id, name, summary)
        await session.commit()
        return result
    except Exception as e:
        logging.error(f"修改小说信息失败: {e}")
        await session.rollback()
        raise e

async def get_novel_detail4service(novel_id: str, session: AsyncSession) -> NovelDomain:
    """根据小说ID获取小说详情"""
    pg_client = PGClient(session)
    try:
        # 1. 获取小说
        novel = await pg_client.get_novel_details(novel_id)
        if not novel:
            raise NovelNotFoundError(novel_id)

        # 2. 获取关联数据
        folders = await pg_client.get_novel_folders(novel_id)
        documents = await pg_client.get_novel_documents(novel_id)
        doc_versions = await pg_client.get_novel_document_versions(novel_id)
        tree_sorts = await pg_client.get_novel_tree_sorts(novel_id)

        # 3. 构建映射
        folder_map: Dict[str, FolderSQLEntity] = {f.folder_id: f for f in folders}
        doc_map: Dict[str, DocumentSQLEntity] = {d.doc_id: d for d in documents}
        
        # 构建版本映射: doc_id -> 版本列表（按创建时间倒序）
        version_map: Dict[str, List[DocumentVersionSQLEntity]] = {}
        for version in doc_versions:
            if version.doc_id not in version_map:
                version_map[version.doc_id] = []
            version_map[version.doc_id].append(version)
        
        # 对每个文档的版本列表按创建时间倒序排序
        for doc_id in version_map:
            version_map[doc_id].sort(key=lambda x: x.create_time, reverse=True)

        # 构建树子节点映射: parent_id -> children list
        tree_children_map: Dict[Optional[str], List[TreeSortSQLEntity]] = {}
        for node in tree_sorts:
            pid = node.parent_id
            if pid not in tree_children_map:
                tree_children_map[pid] = []
            tree_children_map[pid].append(node)
        
        # 排序
        for pid in tree_children_map:
            tree_children_map[pid].sort(key=lambda x: x.sort_order)

        # 4. 递归组装
        def build_hierarchy(parent_id: str | None) -> List[Union[FolderEntity, TableOfContentsEntity]]:
            nodes = tree_children_map.get(parent_id, [])
            result: List[Union[FolderEntity, TableOfContentsEntity]] = []
            for node in nodes:
                if node.node_type == "folder":
                    folder = folder_map.get(node.node_id)
                    if folder:
                        children = build_hierarchy(node.node_id)
                        result.append(FolderAdapter.to_domain(folder, children))
                elif node.node_type == "file":
                    doc = doc_map.get(node.node_id)
                    if doc:
                        # 获取文档的所有版本列表
                        doc_versions_list = version_map.get(doc.doc_id, [])
                        if doc_versions_list:
                            # 验证版本列表非空，确保能够正确转换
                            result.append(TableOfContentsEntityAdapter.to_domain(doc, doc_versions_list))
            return result

        # 5. 转换并返回
        toc = build_hierarchy(None)
        return NovelAdapter.to_domain(novel, toc)

    except Exception as e:
        logging.error(f"获取小说详情失败: {e}")
        raise e


async def create_document4service(
    *,
    session: AsyncSession,
    user_id: str, 
    novel_id: str, 
    folder_id: str|None=None
) -> DocumentDomain:
    """创建章节"""
    pg_client = PGClient(session)
    try:
        if not await pg_client.check_user_exist_by_id(user_id):
            raise UserNotFoundError(f"用户ID {user_id} 不存在")
        document : DocumentSQLEntity= await pg_client.create_novel_document(user_id, novel_id, folder_id)
        version : DocumentVersionSQLEntity= await pg_client.create_novel_document_version(
            version_id=document.current_version_id,
            doc_id=document.doc_id,
            novel_id=novel_id,
            folder_id=folder_id,
        )
        await pg_client.add_node_to_tree(novel_id, document.doc_id, NodeTypeEnum.DOCUMENT, parent_id=folder_id)
        
        await session.commit()
        await session.refresh(document)
        await session.refresh(version)
        document_domain = DocumentAdapter.to_domain(document, [version])
        return document_domain
    except Exception as e:
        logging.error(f"创建文档失败: {e}")
        await session.rollback()
        raise e

async def create_folder4service(user_id: str, novel_id: str, name: str, session: AsyncSession) -> FolderEntity:
    """创建文件夹"""
    pg_client = PGClient(session)
    try:
        if not await pg_client.check_novel_exist_by_id(novel_id):
            raise NovelNotFoundError(novel_id)
            
        folder = await pg_client.create_folder(novel_id, name)
        # Add to tree
        await pg_client.add_node_to_tree(novel_id, folder.folder_id, NodeTypeEnum.FOLDER)
        
        await session.commit()
        return FolderAdapter.to_domain(folder)
    except Exception as e:
        logging.error(f"创建文件夹失败: {e}")
        await session.rollback()
        raise e

async def delete_folder4service(folder_id: str, session: AsyncSession) -> bool:
    """删除文件夹"""
    pg_client = PGClient(session)
    try:
        await pg_client.delete_folder(folder_id)
        await pg_client.delete_tree_node(folder_id)
        
        await session.commit()
        return True
    except Exception as e:
        logging.error(f"删除文件夹失败: {e}")
        await session.rollback()
        raise e

async def update_folder4service(folder_id: str, name: str, session: AsyncSession) -> bool:
    """更新文件夹"""
    pg_client = PGClient(session)
    try:
        result = await pg_client.update_folder(folder_id, name)
        await session.commit()
        return result
    except Exception as e:
        logging.error(f"更新文件夹失败: {e}")
        await session.rollback()
        raise e






# ???
async def get_document_detail4service(doc_id: str, session: AsyncSession) -> DocumentDomain:
    """
        获取文档详情,
    """
    pg_client = PGClient(session)
    try:
        doc = await pg_client.get_document(doc_id)
        if not doc:
            raise DocumentNotFoundError(doc_id)
            
        versions = await pg_client.get_document_versions_by_novel_id(novel_id=doc.novel_id)
        doc_versions = [v for v in versions if v.doc_id == doc_id]
        
        return DocumentAdapter.to_domain(doc, doc_versions)
    except Exception as e:
        logging.error(f"获取文档详情失败: {e}")
        raise e

async def update_document4service(doc_id: str, title: str | None, body_text: str | None, session: AsyncSession) -> DocumentDomain:
    """更新文档"""
    pg_client = PGClient(session)
    try:
        doc = await pg_client.get_document(doc_id)
        if not doc:
            raise DocumentNotFoundError(doc_id)
            
        if title:
            await pg_client.update_document_title(doc_id, title)
            
        if body_text is not None:
            new_version_id = create_uuid()
            await pg_client.create_novel_document_version(
                version_id=new_version_id,
                doc_id=doc_id,
                novel_id=doc.novel_id,
                folder_id=doc.folder_id,
                parent_version_id=doc.current_version_id,
                body_text=body_text
            )
            await pg_client.update_document_current_version(doc_id, new_version_id)
            
        await session.commit()
        return await get_document_detail4service(doc_id, session)
    except Exception as e:
        logging.error(f"更新文档失败: {e}")
        await session.rollback()
        raise e

async def move_node4service(node_id: str, target_parent_id: str | None, sort_order: int, session: AsyncSession) -> bool:
    """移动节点"""
    pg_client = PGClient(session)
    try:
        result = await pg_client.update_tree_node(node_id, target_parent_id, sort_order)
        
        # If it's a document, update its folder_id reference
        tree_node = await pg_client.get_tree_node(node_id)
        if tree_node and tree_node.node_type == NodeTypeEnum.DOCUMENT:
             doc = await pg_client.get_document(node_id)
             if doc:
                 doc.folder_id = target_parent_id
                 session.add(doc)
        
        await session.commit()
        return result
    except Exception as e:
        logging.error(f"移动节点失败: {e}")
        await session.rollback()
        raise e


async def delete_document4service(document_id: str, session: AsyncSession) -> bool:
    """删除文档"""
    pg_client = PGClient(session)
    try:
        result = await pg_client.soft_delete_document(document_id)
        if not result:
            raise DocumentNotFoundError(document_id)
        await session.commit()
        return True
    except Exception as e:
        logging.error(f"删除章节失败: {e}")
        await session.rollback()
        raise e

# 这里的逻辑真的好吗?还是说文档搜索这一块给搜索引擎比较好呃?
async def search_documents_by_title4service(is_remove: bool, keyword: str, session: AsyncSession, novel_id: str | None = None) -> List[DocumentDomain]:
    """根据标题搜索文档"""
    pg_client = PGClient(session)
    try:
        docs = await pg_client.search_documents_by_title(is_remove=is_remove, keyword=keyword, novel_id=novel_id)
        return [DocumentAdapter.to_domain(doc) for doc in docs]
    except Exception as e:
        logging.error(f"根据标题搜索文档失败: {e}")
        raise e

async def search_documents_by_content4service(is_remove: bool, keyword: str, session: AsyncSession, novel_id: str | None = None) -> List[DocumentDomain]:
    """根据正文搜索文档"""
    pg_client = PGClient(session)
    try:
        docs = await pg_client.search_documents_by_content(is_remove=is_remove, keyword=keyword, novel_id=novel_id)
        return [DocumentAdapter.to_domain(doc[0], [doc[1]]) for doc in docs]
    except Exception as e:
        logging.error(f"根据正文搜索文档失败: {e}")
        raise e
