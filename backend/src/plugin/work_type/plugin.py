from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from common.enums import  PluginFromTypeEnum, UITrigger
from infrastructure.pg.pg_models import WorkTypeSQLEntity
from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject
from infrastructure.pg.pg_client import get_session
from core.ui.home import Home,Works


@plugin_meta(
    name="work_type",
    space="official",
    version="0.0.1",
    description="作品类型插件,选择不同的作品类型将影响到后续的创作流程(目前只有支持小说类型)",
    from_type=PluginFromTypeEnum.SYSTEM,
)
class WorkTypePlugin:

    @runtime_config
    def __init__(self, session: AsyncSession = Inject(get_session)):
        self.session = session
        
    def _translate_work_type_to_detail(self, entity: WorkTypeSQLEntity):
        return {
            "id":entity.id,
            "name":entity.name,
            "tags":entity.tags,
            "relationship":entity.relationship
        }
    def _translate_work_type_to_select(self, entity: WorkTypeSQLEntity):
        return {
            "id":entity.id,
            "name":entity.name,
        }
        
    @operation(
        name="get_work_type_list_in_plugin_expand",
        description="获取作品类型",
        with_ui=[Home.PluginExpand.PluginCard.filter(name="work_type")],
        ui_target=Home.PluginDetails.Info,
        trigger=UITrigger.CLICK
    )
    async def get_work_type_list_in_plugin_expand(self):
        """获取作品类型列表."""
        stmt = select(WorkTypeSQLEntity)
        result = await self.session.execute(stmt)
        entities = result.scalars().all()
        data=[self._translate_work_type_to_detail(entity) for entity in entities]
        return {
            "info_type":"WorkTypeSettings",
            "data": { "items": data }
            }
    
    
    @operation(
        name="get_work_type_list_in_work_create",
        description="获取作品类型",
        with_ui=[Works.WorkCreate.filter()],
        ui_target=Works.WorkTypeSelect,
        trigger=UITrigger.CLICK
    )
    async def get_work_type_list_in_work_create(self):
        """获取作品类型列表."""
        stmt = select(WorkTypeSQLEntity)
        result = await self.session.execute(stmt)
        entities = result.scalars().all()
        data=[self._translate_work_type_to_select(entity) for entity in entities]
        return {
            "info_type":"WorkTypeSelect",
            "data":data
            }
