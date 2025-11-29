from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import CreateNovelRequest, GetNovelListRequest, Response
from common.clients.pg.pg_client import PGClient, get_session
from common.clients.pg.pg_model import NovelEntity, DocmentEntity, FolderEntity, TreeSortEntity

router = APIRouter(tags=["document"])

@router.get("/debug")
async def debug_router():
    return {"status": "document router registered", "message": "pong"}

@router.post("/get_novels", response_model=Response[List[NovelEntity]])
async def get_novels(request: GetNovelListRequest, session: AsyncSession = Depends(get_session)):
    """获取所有小说"""
    pg_client = PGClient(session)
    novels = await pg_client.get_novel_list(request.user_id)
    return Response.ok(data=novels)

@router.post("/create_novel", response_model=Response[NovelEntity])
async def create_novel(request: CreateNovelRequest, session: AsyncSession = Depends(get_session)):
    """创建小说"""
    pg_client = PGClient(session)
    # Note: request.summary corresponds to description in model, assuming mapping logic or updates
    novel = await pg_client.create_novel(request.user_id, request.name, request.summary)
    return Response.ok(data=novel)

@router.get("/novel/{novel_id}", response_model=Response[NovelEntity])
async def get_novel(novel_id: str, session: AsyncSession = Depends(get_session)):
    """获取小说详情"""
    pg_client = PGClient(session)
    novel = await pg_client.get_novel(novel_id)
    if not novel:
        return Response.fail("小说不存在")
    return Response.ok(data=novel)

