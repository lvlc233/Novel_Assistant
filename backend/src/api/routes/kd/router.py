from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.base import Response
from api.routes.kd.schema import GetKDsRequest
from infrastructure.pg.pg_client import get_session

router = APIRouter(prefix="/kd", tags=["kd"])

@router.post("/get_kds")
async def get_kds4api(request: GetKDsRequest, session: AsyncSession = Depends(get_session)): # ->Response[List[NovelAbbreviateResponse]]:
    """获取所有知识库的
    Args:
        user_id: str, # 用户ID
        name: str | None, # 小说名称
        summary: str | None, # 小说简介
    Return:
        novel_id: str, # 小说ID
    """
    
    # novel_id = await create_novel4service(request.user_id, request.name, request.summary, session)
    # return Response.ok(data=novel_id)
    return Response.ok(data=[])
