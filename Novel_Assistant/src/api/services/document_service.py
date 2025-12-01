import logging
from typing import List, Dict, Union, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from common.clients.pg.pg_client import PGClient
from common.clients.pg.pg_models import (
    FolderSQLEntity, 
    DocumentSQLEntity, 
    DocumentVersionSQLEntity, 
    TreeSortSQLEntity
)

from common.err import (
    UserNotFoundError,
    NovelNotFoundError,
    ChapterNotFoundError,
)
from common.adapter.novel import (
    NovelAdapter, 
    FolderAdapter, 
    TableOfContentsEntityAdapter,
    DocumentAdapter
)    
from core.domain.models import (
    NovelDomain, 
    FolderEntity, 
    TableOfContentsEntity,
    DocumentDomain,

)
from typing import Union

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


async def create_chapter4service(
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
        chapter : DocumentSQLEntity= await pg_client.create_novel_document(user_id, novel_id, folder_id)
        version : DocumentVersionSQLEntity= await pg_client.create_novel_document_version(
            version_id=chapter.current_version_id,
            doc_id=chapter.doc_id,
            novel_id=novel_id,
            folder_id=folder_id,
        )
        if folder_id:
            await pg_client.add_document_to_folder(novel_id, folder_id, chapter.doc_id)
        await session.commit()
        await session.refresh(chapter)
        await session.refresh(version)
        document_domain = DocumentAdapter.to_domain(chapter, [version])
        return document_domain
    except Exception as e:
        logging.error(f"创建章节失败: {e}")
        await session.rollback()
        raise e

async def delete_chapter4service(chapter_id: str, session: AsyncSession) -> bool:
    """删除章节"""
    pg_client = PGClient(session)
    try:
        result = await pg_client.soft_delete_document(chapter_id)
        if not result:
            raise ChapterNotFoundError(chapter_id)
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
