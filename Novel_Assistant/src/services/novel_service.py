
import logging

from typing import List, Dict, Union, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel,Field

from common.clients.pg.pg_client import PGClient
from common.clients.pg.pg_models import (
    # FolderSQLEntity, 
    DocumentMetadataSQLEntity,
    DocumentVersionSQLEntity,
    NovelSQLEntity, 
    # TreeSortSQLEntity,
    
)
from common.enums import NovelState
from common.errors import (
    UserNotFoundError,
    NovelNotFoundError,
    DocumentNotFoundError,
)
from common.utils import (
    get_now_time,
    format_time
)

from core.domain.models import (
    NovelItemUse2Overview,
    DirectoryNode,
    NovelDetail
)
from typing import Union





async def get_novel_existing_overview_list4service(user_id: str, session: AsyncSession) -> List[NovelItemUse2Overview]:
    """根据用户ID，获取存在的小说概述列表，"""
    pg_client = PGClient(session)
    try:
        # 使用 GROUP BY 聚合查询，一次性获取小说信息和总字数
        novel_list_with_count = await pg_client.get_user_active_novels_with_word_count(user_id)
        
        novels = []
        for novel_entity, word_count in novel_list_with_count:
            # 提取并格式化时间
            create_time = format_time(novel_entity.novel_create_time)
            update_time = format_time(novel_entity.novel_update_time)
            
            # 计算断更时间
            hiatus_interval = (get_now_time() - novel_entity.novel_update_time).days
            
            # 准备字典数据，排除需要手动转换的字段和SQLAlchemy内部状态
            novel_data = {
                k: v for k, v in novel_entity.__dict__.items() 
                if k not in {'novel_create_time', 'novel_update_time', '_sa_instance_state'}
            }
            
            novel_overview = NovelItemUse2Overview(
                novel_word_count=word_count,
                novel_hiatus_interval=hiatus_interval,
                novel_create_time=create_time,
                novel_update_time=update_time,
                **novel_data
            )
            novels.append(novel_overview)
        return novels
    except Exception as e:
        logging.error(f"获取存在小说列表失败: {e}")
        raise e


async def create_novel4service(
    user_id: str,
    novel_cover_image_url: str | None,
    novel_name: str | None,
    novel_summary: str | None,
    kd_id_list: List[str] = [],
    *,
    session: AsyncSession,
) -> NovelItemUse2Overview:
    """创建小说。
    Args:
        user_id: str, # 用户ID
        novel_cover_image_url: str | None, # 小说封面url
        novel_name: str | None, # 小说名称
        novel_summary: str | None, # 小说简介
        kd_id_list: List[str] = [], # 知识库ID列表
    Return:
        novel_id: str, # 小说ID
    """
    pg_client = PGClient(session)
    novel = await pg_client.create_novel_entity(
        user_id=user_id,
        novel_cover_image_url=novel_cover_image_url,
        novel_name=novel_name,
        novel_summary=novel_summary,
    )
    await pg_client.creat_novel_kd_mapping(
        novel_id=novel.novel_id,
        kd_id_list=kd_id_list,
    )
    novel_item_use2overview=NovelItemUse2Overview(
        novel_id=novel.novel_id,
        novel_name=novel.novel_name,
        novel_cover_image_url=novel.novel_cover_image_url,
        novel_summary=novel.novel_summary,
        novel_state=NovelState.UPDATING,
        novel_create_time=format_time(get_now_time()),
        novel_update_time=format_time(get_now_time()),
        novel_hiatus_interval=0,
        novel_word_count=0
    )

    # 提交事务，确保数据持久化
    await session.commit()

    return novel_item_use2overview



async def get_novel_directory4service(novel_id: str, session: AsyncSession) -> List[DirectoryNode]:
    """获取指定小说ID的小说目录,小说目录具有排序规则
    Args:
        novel_id: str, # 小说ID
    Return:
        directory: List[DirectoryNode], # 目录树
    """
    pg_client = PGClient(session)
    try:
        # 1. Fetch all elements
        tree_items, folder_map, doc_map = await pg_client.get_novel_directory_elements(novel_id)
        
        # 2. Build Node Map
        node_map: Dict[str, DirectoryNode] = {}
        for item in tree_items:
            if item.node_type == "folder":
                folder = folder_map.get(item.node_id)
                if folder:
                    node_map[item.node_id] = DirectoryNode(
                        node_id=item.node_id,
                        node_name=folder.folder_name,
                        node_type="folder",
                        sort_order=item.node_sort_order,
                        create_time=folder.folder_create_time.isoformat() if folder.folder_create_time else None
                    )
            elif item.node_type == "document":
                doc_tuple = doc_map.get(item.node_id)
                if doc_tuple:
                    doc, word_count = doc_tuple
                    node_map[item.node_id] = DirectoryNode(
                        node_id=item.node_id,
                        node_name=doc.document_title,
                        node_type="document",
                        sort_order=item.node_sort_order,
                        word_count=word_count,
                        update_time=doc.document_update_time.isoformat() if doc.document_update_time else None
                    )
        
        # 3. Build Tree Structure
        # parent_id -> list of children nodes
        adj_list: Dict[Optional[str], List[DirectoryNode]] = {}
        
        # Also need to map which items belong to which parent based on TreeSort
        # tree_items contains parent_id info
        for item in tree_items:
            if item.node_id not in node_map:
                continue
            
            node = node_map[item.node_id]
            parent_id = item.parent_id
            
            if parent_id not in adj_list:
                adj_list[parent_id] = []
            adj_list[parent_id].append(node)
            
        # 4. Recursive Build Function
        def build_tree(parent_id: Optional[str]) -> List[DirectoryNode]:
            children = adj_list.get(parent_id, [])
            
            # Sort: Primary sort_order, Secondary type (folder first -> folder < document? No, usually folder first means we want folder to be 'smaller' than document if sorting ASC. 
            # Let's say we assign type_rank: folder=0, document=1)
            def sort_key(node: DirectoryNode):
                type_rank = 0 if node.node_type == "folder" else 1
                return (type_rank, node.sort_order)
            
            children.sort(key=sort_key)
            
            for child in children:
                # Recursively build children for folders
                if child.node_type == "folder":
                    child.children = build_tree(child.node_id)
            
            return children

        return build_tree(None)
        
    except Exception as e:
        logging.error(f"获取小说目录失败: {e}")
        raise e


async def get_novel_detail4service(novel_id: str, session: AsyncSession) -> NovelDetail:
    """获取指定小说ID的小说详情。
    Args:
        novel_id: str, # 小说ID
    Return:
        novel_detail: NovelDetailDomain, # 小说详情
    """
    pg_client = PGClient(session)
    try:
        # 1. Check/Get Novel
        novel = await pg_client.get_novel_by_id(novel_id)
        if not novel:
            raise NovelNotFoundError(novel_id)
            
        # 2. Get Word Count
        word_count = await pg_client.get_novel_word_count(novel_id)
        
        # 3. Get Directory
        directory = await get_novel_directory4service(novel_id, session)
        
        # 4. Calculate Hiatus Interval
        hiatus_interval = (get_now_time() - novel.novel_update_time).days
        
        return NovelDetail(
            novel_id=novel.novel_id,
            novel_name=novel.novel_name,
            novel_cover_image_url=novel.novel_cover_image_url,
            novel_summary=novel.novel_summary,
            novel_state=novel.novel_state,
            novel_create_time=novel.novel_create_time.isoformat(),
            novel_update_time=novel.novel_update_time.isoformat(),
            novel_hiatus_interval=hiatus_interval,
            novel_word_count=word_count,
            directory=directory
        )
    except Exception as e:
        logging.error(f"获取小说详情失败: {e}")
        raise e