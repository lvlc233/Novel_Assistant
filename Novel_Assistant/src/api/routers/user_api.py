from typing import Dict,List
from fastapi import APIRouter,Depends

from sqlalchemy.ext.asyncio import AsyncSession



from common.clients.pg.pg_models import UserSQLEntity
from common.clients.pg.pg_client import get_session,PGClient
from common.utils import (
    create_uuid, 
    passwd_hash
)

from api.models import (
    CreateUserRequest, 
    Response,
    UserIdResponse
)

from services.user_service import ( 
    create_user4service,
    login4service
)

router = APIRouter(tags=["user"])

@router.post("/create_user", response_model=Response[UserIdResponse])
async def create_user4api(request: CreateUserRequest, session: AsyncSession = Depends(get_session)) -> Response[UserIdResponse]:
    """创建用户。
    Args:
        name: str, # 用户名称
        password: str, # 用户密码
    Return:
        user_id: UserIdResponse, # 用户ID
            user_id: str, # 用户ID
    """
    user_id = await create_user4service(request.name, request.password, session)
    return Response.ok(data=UserIdResponse(user_id=user_id))

@router.post("/login", response_model=Response[UserIdResponse])
async def login4api(request: CreateUserRequest, session: AsyncSession = Depends(get_session)) -> Response[UserIdResponse]:
    """用户登录。
    Args:
        name: str, # 用户名称
        password: str, # 用户密码
    Return:
        user_id: UserIdResponse, # 用户ID
            user_id: str, # 用户ID
    """
    user_id = await login4service(request.name, request.password, session)
    return Response.ok(data=UserIdResponse(user_id=user_id))


@router.get("/get_user_test", response_model=Response[UserSQLEntity])
async def get_user4api_test(user_name: str, session: AsyncSession = Depends(get_session)) -> Response[UserSQLEntity]:
    """获取用户（测试用）。
    Args:
        user_name: str, # 用户名称
    Return:
        user: UserSQLEntity, # 用户实体
            id: str, # 用户ID
            name: str, # 用户名称
            password: str, # 密码
    """
    pg_client = PGClient(session)
    user = await pg_client.get_user_by_name(user_name)
    return Response.ok(data=user)
