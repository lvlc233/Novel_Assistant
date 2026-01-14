from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import (
    GetKDsRequest,
    Response,
    NovelAbbreviateResponse,
    NovelDetailResponse

)
from common.clients.pg.pg_client import get_session


from common.adapter.novel import NovelAdapter
from api.services.document_service import (
    create_novel4service,
    get_novel_existing_list4service,
    get_novel_detail4service,
    delete_novel4service,
    update_novel_info4service,
)

router = APIRouter(tags=["kd"])

@router.post("/get_kds")
async def get_kds4api(request: GetKDsRequest, session: AsyncSession = Depends(get_session))->Response[List[NovelAbbreviateResponse]]:
    """获取所有知识库的
    Args:
        user_id: str, # 用户ID
        name: str | None, # 小说名称
        summary: str | None, # 小说简介
    Return:
        novel_id: str, # 小说ID
    """
    
    novel_id = await create_novel4service(request.user_id, request.name, request.summary, session)
    return Response.ok(data=novel_id)

