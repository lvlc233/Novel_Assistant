from ast import Dict
import logging
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from common.clients.pg.pg_client import PGClient
from common.utils import (
    passwd_hash
)
from common.err import (
    UserNotFoundError,
    NovelNotFoundError
)
from core.domain.models import NovelDomain

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
        novels = await pg_client.get_existing_novel_list(user_id)
        
        return novels
    except Exception as e:
        logging.error(f"获取存在小说列表失败: {e}")
        raise e


