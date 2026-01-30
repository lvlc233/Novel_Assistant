from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.work_type.schema import WorkTypeDetailResponse, WorkTypeResponse
from infrastructure.pg.pg_client import get_session
from services.work_type.service import WorkTypeService

router = APIRouter(prefix="/plugin/work/type", tags=["work-types"])

def get_work_type_service(session: AsyncSession = Depends(get_session)) -> WorkTypeService:
    return WorkTypeService(session)

@router.get("", response_model=Response[List[WorkTypeResponse]])
async def get_work_type_list(
    service: WorkTypeService = Depends(get_work_type_service)
) -> Response[List[WorkTypeResponse]]:
    """获取作品类型列表."""
    data = await service.get_work_type_list()
    return Response.ok(data=data)

@router.get("/{work_type_id}", response_model=Response[WorkTypeDetailResponse])
async def get_work_type_detail(
    work_type_id: str,
    service: WorkTypeService = Depends(get_work_type_service)
) -> Response[WorkTypeDetailResponse]:
    """获取作品类型详情."""
    data = await service.get_work_type_detail(work_type_id)
    return Response.ok(data=data)
