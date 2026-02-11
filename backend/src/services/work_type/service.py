"""Work Type Service Module."""
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.work_type.schema import WorkTypeDetailResponse, WorkTypeResponse
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import WorkTypeSQLEntity


class WorkTypeService:
    """作品类型服务类."""
    def __init__(self, session: AsyncSession):
        """Initialize WorkTypeService."""
        self.session = session

    async def get_work_type_list(self) -> List[WorkTypeResponse]:
        """获取作品类型列表."""
        stmt = select(WorkTypeSQLEntity)
        result = await self.session.execute(stmt)
        entities = result.scalars().all()
        return [
            WorkTypeResponse(
                id=entity.id,
                enabled=entity.enabled,
                type=entity.name
            )
            for entity in entities
        ]

    async def get_work_type_detail(self, work_type_id: str) -> WorkTypeDetailResponse:
        """获取作品类型详情."""
        stmt = select(WorkTypeSQLEntity).where(WorkTypeSQLEntity.id == work_type_id)
        result = await self.session.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(f"Work type {work_type_id} not found")
            
        return WorkTypeDetailResponse(
            id=entity.id,
            enabled=entity.enabled,
            tags=entity.tags,
            relationship=entity.relationship,
            configurable=entity.configurable
        )
