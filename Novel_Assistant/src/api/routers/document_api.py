from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import (
    CreateNovelRequest, 
    GetNovelListRequest, 
    Response
)
from common.clients.pg.pg_client import PGClient, get_session
from common.clients.pg.pg_model import NovelEntity
from common.err import NovelNotFoundError
from api.services.document_service import (
    create_novel4service,
    get_novels4service
)

router = APIRouter(tags=["document"])

@router.get("/debug")
async def debug_router():
    return {"status": "document router registered", "message": "pong"}

@router.post("/create_novel")
async def create_novel(request: CreateNovelRequest, session: AsyncSession = Depends(get_session)):
    """创建小说"""
    
    novel_id = await create_novel4service(request.user_id, request.name, request.summary, session)
    return Response.ok(data=novel_id)


@router.post("/get_novels")
async def get_novels4api(request: GetNovelListRequest, session: AsyncSession = Depends(get_session)):
    """获取所有小说"""
    novels = await get_novel_existing_list4service(request.user_id, session)
    return Response.ok(data=novels)


@router.get("/novel/{novel_id}", response_model=Response[NovelEntity])
async def get_novel(novel_id: str, session: AsyncSession = Depends(get_session)):
    """获取小说详情"""
    pg_client = PGClient(session)
    exist = await pg_client.check_novel_exist(novel_id)
    if not exist:
        raise NovelNotFoundError(novel_id)
    novel = await pg_client.get_novel_details(novel_id)
    if not novel:
        raise NovelNotFoundError(novel_id)

    return Response.ok(data=novel)

