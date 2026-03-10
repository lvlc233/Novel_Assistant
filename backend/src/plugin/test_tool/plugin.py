from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from common.enums import MemoryTypeEnum, PluginFromTypeEnum, UITrigger
from common.errors import ResourceNotFoundError
from common.utils.utils import create_uuid, get_now_time, load_chat_model_with_env
from infrastructure.pg.pg_models import MemorySQLEntity
from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject
from infrastructure.pg.pg_client import get_session
from core.ui.home import Home
from langchain_core.messages import SystemMessage, HumanMessage

@plugin_meta(
    name="计算器",
    space="test",
    version="0.0.1",
    description="计算器插件",
    from_type=PluginFromTypeEnum.CUSTOM,
    tags=["tool"]
)
class CalculatorPlugin:

    @runtime_config
    def __init__(
        self, 
    ):
        pass

    @operation(
        name="add",
        description="使用计算器进行加法运算",
    )
    async def manage_memories(self,a:int,b:int):
        """管理记忆 UI"""
        
        return {a+b}


