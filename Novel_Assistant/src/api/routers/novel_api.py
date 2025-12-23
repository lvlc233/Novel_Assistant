from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.domain.models import(
    NovelItemUse2Overview,
    NovelDetail
) 
from api.models import (
    CreateNovelRequest, 
    GetNovelListRequest, 
    GetNovelDetailRequest,
    DeleteNovelRequest,
    UpdateNovelRequest,
    Response,


)
from services.novel_service import (
    get_novel_existing_overview_list4service,
    create_novel4service,
    get_novel_detail4service
)
from services.user_service import check_user_exist_by_user_id4service
from common.clients.pg.pg_client import get_session



router = APIRouter(tags=["novel"])

# @router.post("/create_novel")
# async def create_novel(request: CreateNovelRequest, session: AsyncSession = Depends(get_session))->Response[str]:
#     """创建小说。
#     Args:
#         user_id: str, # 用户ID
#         name: str | None, # 小说名称
#         summary: str | None, # 小说简介
#     Return:
#         novel_id: str, # 小说ID
#     """
    
#     novel_id = await create_novel4service(request.user_id, request.name, request.summary, session)
#     return Response.ok(data=novel_id)



@router.post("/get_novels")
async def get_novel_overview_list_4api(request: GetNovelListRequest, session: AsyncSession = Depends(get_session))->Response[List[NovelItemUse2Overview]]:
    """获取所有小说的缩略视图。
    Args:
        user_id: str , # 用户ID
    Return:
        novels: List[NovelItemUse2Overview] ,# 小说概述列表。
    """
    await check_user_exist_by_user_id4service(request.user_id,session=session)
    novels = await get_novel_existing_overview_list4service(request.user_id, session)
    return Response.ok(data=novels)

@router.post("/create_novel")
async def create_novel4api(request: CreateNovelRequest, session: AsyncSession = Depends(get_session))->Response[NovelItemUse2Overview]:
    """创建小说。
    Args:
        user_id: str, # 用户ID
        name: str | None, # 小说名称
        summary: str | None, # 小说简介
    Return:
        novel_item_use2overview: NovelItemUse2Overview, # 小说视图
    """
    await check_user_exist_by_user_id4service(request.user_id,session=session)
    request=request.__dict__
    novel_item_use2overview = await create_novel4service(session=session,**request)
    return Response.ok(data=novel_item_use2overview)

@router.post("/get_novel_detail")
async def get_novel_detail4api(request:GetNovelDetailRequest , session: AsyncSession = Depends(get_session))->Response[NovelDetail]:
    """获取小说详情。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说IDNovelDetail
    Return:
        novel: NovelDetailResponse, # 小说详情
    """
    await check_user_exist_by_user_id4service(request.user_id,session=session)
    novel_detail = await get_novel_detail4service(request.novel_id, session)
    return Response.ok(data=novel_detail)

# @router.post("/delete_novel")
# async def delete_novel4api(request: DeleteNovelRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
#     """删除小说。
#     Args:
#         novel_id: str, # 小说ID
#     Return:
#         result: bool, # 是否删除成功
#     """
#     result = await delete_novel4service(request.novel_id, session)
#     return Response.ok(data=result)

# @router.post("/update_novel_info")
# async def update_novel_info4api(request: UpdateNovelRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
#     """修改小说信息。
#     Args:
#         novel_id: str, # 小说ID
#         name: str | None, # 小说名称
#         summary: str | None, # 小说简介
#     Return:
#         result: bool, # 是否修改成功
#     """
#     result = await update_novel_info4service(request.novel_id, request.name, request.summary, session)
#     return Response.ok(data=result)



