
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from common.clients.pg.pg_client import PGClient
from common.errors import UserNotFoundError
from common.utils import (
    passwd_hash
)

async def check_user_exist_by_user_id4service(user_id:str,*,session: AsyncSession):
    pg_client=PGClient(session)
    try:
        if not await pg_client.check_user_exist_by_id(user_id):
            raise UserNotFoundError(f"用户ID {user_id} 不存在")
    except Exception as e:
        logging.error(f"用户异常:当前用户不存在: {e}")
        raise e



async def create_user4service(name: str, password: str,*,session: AsyncSession) -> str|None:
    """创建用户"""
    pg_client = PGClient(session)
    try:
        user = await pg_client.create_user(name, passwd_hash(password))
        user_id = user.id
        await session.commit()
        return user_id
    except Exception as e:
        await session.rollback()
        logging.error(f"创建用户失败: {e}")
        raise

async def login4service(name: str, password: str,session: AsyncSession) -> str|None:
    """用户登录"""
    pg_client = PGClient(session)
    try:
        user = await pg_client.user_login(name, password)
        return user.id
    except Exception as e:
        logging.error(f"登录用户失败: {e}")
        raise
