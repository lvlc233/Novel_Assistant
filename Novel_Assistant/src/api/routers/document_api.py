from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import (
    CreateNovelRequest, 
    GetNovelListRequest, 
    Response,
    NovelAbbreviateResponse,
    NovelDetailResponse,
    GetNovelDetailRequest
)
from common.clients.pg.pg_client import get_session


from common.adapter.novel import NovelAdapter
from api.services.document_service import (
    create_novel4service,
    get_novel_existing_list4service,
    get_novel_detail4service 
)

router = APIRouter(tags=["document"])

@router.get("/debug")
async def debug_router():
    return {"status": "document router registered", "message": "pong"}

@router.post("/create_novel")
async def create_novel(request: CreateNovelRequest, session: AsyncSession = Depends(get_session))->Response[str]:
    """创建小说"""
    
    novel_id = await create_novel4service(request.user_id, request.name, request.summary, session)
    return Response.ok(data=novel_id)


@router.post("/get_novels")
async def get_novels4api(request: GetNovelListRequest, session: AsyncSession = Depends(get_session))->Response[List[NovelAbbreviateResponse]]:
    """获取所有小说"""
    novels = await get_novel_existing_list4service(request.user_id, session)
    novels = [NovelAdapter.from_domain_abbreviate(novel) for novel in novels]
    return Response.ok(data=novels)

@router.post("/get_novel_detail")
async def get_novel_detail4api(request:GetNovelDetailRequest , session: AsyncSession = Depends(get_session))->Response[NovelDetailResponse]:
    """获取小说详情"""
    novel = await get_novel_detail4service(request.novel_id, session)
    novel = NovelAdapter.from_domain_detail(novel)
    return Response.ok(data=novel)