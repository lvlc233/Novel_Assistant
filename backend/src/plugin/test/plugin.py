
from os import name
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import KnowledgeBaseSQLEntity, KnowledgeChunkSQLEntity
from plugin.kd.schema import KDCreateRequest, KDDescriptionCreateRequest, KDDescriptionResponse, KDDescriptionUpdateRequest, KDMetaResponse, KDUpdateRequest
from core.plugin.annotations import plugin_meta, runtime_config, operation
from common.enums import PluginFromTypeEnum, UITrigger
from sqlalchemy import delete, select, or_, and_
from sqlalchemy import desc
from core.ui.home import Home
from core.plugin.di import Inject
from infrastructure.pg.pg_client import get_session

@plugin_meta(
    name="测试插件",
    space="test", 
    version="0.0.1",
    description="一个测试插件.",
    from_type=PluginFromTypeEnum.CUSTOM
)
class KDPlugin:
    
    @runtime_config
    def __init__(self,name:str,id:str):
        self.id = id
        self.name = name

    @operation(
        name="manage_knowledge_bases",
        description="管理知识库 UI",
        ui_target=Home.PluginDetails.Info,
        with_ui=[Home.PluginExpand.PluginCard.filter(name="test")],
        trigger=UITrigger.CLICK
    )
    async def manage_knowledge_bases(self):
        """管理知识库 UI"""
        return {
            "name": self.name,
            "data": [{"id":self.id,"name":self.name}],
            "info_type": "WorkTypeSelect"
        }


