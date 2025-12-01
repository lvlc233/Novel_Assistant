from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import (
    CreateNovelRequest, 
    GetNovelListRequest, 
    GetNovelDetailRequest,
    DeleteNovelRequest,
    UpdateNovelRequest,
    CreateChapterRequest,

    Response,
    NovelAbbreviateResponse,
    NovelDetailResponse,
    CreateChapterResponse,

)
from common.clients.pg.pg_client import get_session


from common.adapter.novel import NovelAdapter, DocumentAdapter
from api.services.document_service import (
    create_novel4service,
    get_novel_existing_list4service,
    get_novel_detail4service,
    delete_novel4service,
    update_novel_info4service,
    create_chapter4service,
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

@router.post("/delete_novel")
async def delete_novel4api(request: DeleteNovelRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """删除小说"""
    result = await delete_novel4service(request.novel_id, session)
    return Response.ok(data=result)

@router.post("/update_novel_info")
async def update_novel_info4api(request: UpdateNovelRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """修改小说信息"""
    result = await update_novel_info4service(request.novel_id, request.name, request.summary, session)
    return Response.ok(data=result)



@router.post("/create_chapter")
async def create_chapter4api(request: CreateChapterRequest, session: AsyncSession = Depends(get_session))->Response[CreateChapterResponse]:
    """创建章节"""
    chapter_domain = await create_chapter4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_id=request.folder_id, 
        session=session)
    chapter = DocumentAdapter.from_domain(chapter_domain)
    return Response.ok(data=chapter)
