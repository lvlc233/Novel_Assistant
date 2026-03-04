from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from common.enums import NodeTypeEnum, WorkTypeEnum, PluginFromTypeEnum, UITrigger
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import WorkTypeSQLEntity
from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject
from infrastructure.pg.pg_client import get_session
from core.ui.home import Home

class WorkTypeResponse(BaseModel):
    id: UUID
    enabled: bool
    type: WorkTypeEnum

class WorkTypeDetailResponse(BaseModel):
    id: UUID
    enabled: bool
    tags: List[NodeTypeEnum]
    relationship: List[str]
    configurable: bool

@plugin_meta(
    name="work_type",
    space="official",
    version="0.0.1",
    description="作品类型插件",
    from_type=PluginFromTypeEnum.OFFICIAL,
    tags=["work_type"]
)
class WorkTypePlugin:

    @runtime_config
    def __init__(self, session: AsyncSession = Inject(get_session)):
        self.session = session

    @operation(
        name="manage_work_types",
        description="管理作品类型",
        ui_target=Home.PluginDetails.Info,
        with_ui=[Home.PluginExpand.PluginCard.filter(name="work_type")],
        trigger=UITrigger.CLICK
    )
    async def manage_work_types(self):
        """管理作品类型 UI"""
        types = await self.get_work_type_list()
        return {
            "name": "work_type",
            "data": {"types": [t.model_dump() for t in types]},
            "info_type": "WorkTypeSettings"
        }

    @operation(name="get_work_type_list")
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

    @operation(name="get_work_type_detail")
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
