from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.novel.schema import (
    NovelOverview,
    NovelDetail,
    CreateNovelRequest, 
    GetNovelListRequest, 
    GetNovelDetailRequest,
)

from services.novel.service import NovelService
from services.user.service import check_user_exist_by_user_id4service
from infrastructure.pg.pg_client import get_session

router = APIRouter(prefix="/novel", tags=["novel"])

def get_novel_service(session: AsyncSession = Depends(get_session)) -> NovelService:
    return NovelService(session)

# ok
@router.post("/get_novels")
async def get_novel_overview_list_4api(
    request: GetNovelListRequest, 
    service: NovelService = Depends(get_novel_service),
    session: AsyncSession = Depends(get_session) # Keep for user check, or move user check to service
)->Response[List[NovelOverview]]:
    """获取所有小说的缩略视图。"""
    # Note: user check is done in service if we want, but here it's explicit.
    # Actually, in my refactored service, I didn't include check_user_exist_by_user_id4service in get_novel_existing_overview_list
    # Let's check user here or inside service. The old service code didn't check inside the function?
    # Wait, old code:
    # await check_user_exist_by_user_id4service(request.user_id,session=session)
    # novels = await get_novel_existing_overview_list4service(request.user_id, session)
    
    # My new service method get_novel_existing_overview_list doesn't call check_user_exist_by_user_id4service.
    # So I should keep it here or add it to service. 
    # For consistency with DocumentService where I added it, I should probably add it to NovelService too?
    # Let's check DocumentService... 
    # Yes, create_folder calls check_user_exist_by_user_id4service.
    # But get_novel_existing_overview_list in NovelService (refactored) does NOT call it.
    # I should probably add it to NovelService methods for consistency.
    # But for now, to minimize changes, I will call it here.
    # However, check_user_exist_by_user_id4service needs session. 
    # service.session is available.
    
    # Better approach: Move user check to service to be self-contained. 
    # But I already wrote NovelService. I don't want to rewrite it immediately if not necessary.
    # I will call check_user_exist_by_user_id4service here using service.session.
    
    await check_user_exist_by_user_id4service(request.user_id, session=service.session)
    novels = await service.get_novel_existing_overview_list(request.user_id)
    return Response.ok(data=novels)

# ok
@router.post("/create_novel")
async def create_novel4api(
    request: CreateNovelRequest, 
    service: NovelService = Depends(get_novel_service)
)->Response[NovelOverview]:
    """创建小说。"""
    await check_user_exist_by_user_id4service(request.user_id, session=service.session)
    
    novel_item_use2overview = await service.create_novel(
        user_id=request.user_id,
        novel_cover_image_url=request.novel_cover_image_url,
        novel_name=request.novel_name,
        novel_summary=request.novel_summary,
        kd_id_list=request.kd_id_list
    )
    return Response.ok(data=novel_item_use2overview)

# ok
@router.post("/get_novel_detail")
async def get_novel_detail4api(
    request: GetNovelDetailRequest, 
    service: NovelService = Depends(get_novel_service)
)->Response[NovelDetail]:
    """获取小说详情。"""
    await check_user_exist_by_user_id4service(request.user_id, session=service.session)
    novel_detail = await service.get_novel_detail(request.novel_id)
    return Response.ok(data=novel_detail)
