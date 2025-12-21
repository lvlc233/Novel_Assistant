
import logging

from typing import List, Dict, Union, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel,Field

from common.clients.pg import pg_client
from common.clients.pg.pg_client import PGClient
from common.clients.pg.pg_models import (
    # FolderSQLEntity, 
    # DocumentSQLEntity, 
    # DocumentVersionSQLEntity,
    NovelSQLEntity, 
    # TreeSortSQLEntity,
    
)

from common.err import (
    UserNotFoundError,
    NovelNotFoundError,
    DocumentNotFoundError,
)

from core.domain.models import (
    NovelItemUse2Overview

)
from typing import Union





async def get_novel_existing_overview_list4service(user_id: str, session: AsyncSession) -> List[NovelItemUse2Overview]:
    """根据用户ID，获取存在的小说概述列表，"""
    pg_client = PGClient(session)
    try:
        if not await pg_client.check_user_exist_by_id(user_id):
            raise UserNotFoundError(f"用户ID {user_id} 不存在")
        novels_db:List[NovelSQLEntity]= await pg_client.get_user_active_novels(user_id)
        novels = []
        for novel_db in novels_db:
            metadata=novel_db.__dict__
            novel = NovelItemUse2Overview(
                **metadata
            )
            novels.append(novel)
        return novels
    except Exception as e:
        logging.error(f"获取存在小说列表失败: {e}")
        raise e
