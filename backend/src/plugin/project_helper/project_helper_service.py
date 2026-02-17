from langchain_core.messages import BaseMessageChunk
from langgraph.checkpoint.base import BaseCheckpointSaver
from loguru import logger as log
from typing import Dict, List, TypedDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.agent.project_helper.schema import (
    ProjectHelperChatConfigRequest,
    ProjectHelperChatConfigResponse,
    ProjectHelperResourcesRequest,
    ProjectHelperResourcesResponse,
)
from backend.src.common.model.base_agent import build_agent
from backend.src.common.utils import plugin as plugin_utils
from backend.src.core.agents.kd_builder import graph
from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum, RenderType
from infrastructure.pg.pg_models import PluginSQLEntity
from common.model.base_plugin_models import InternalOperationBuilder
from common.model.plugin_definition  import LoaderType,PluginDefinition
from common.enums import LoaderType, PluginFromTypeEnum, PluginScopeTypeEnum, RenderType
from core.plugin.register import PluginRegistry

# 变更记录:
# 注释者: BackendAgent(python)
# 时间: 2026-02-13 01:50:00
# 使用位置: ProjectHelperService 配置与资源持久化服务
# 实现概述: 基于 PluginSQLEntity.default_config 存取配置与资源

class ProjectHelperService:
    def __init__(self, session: AsyncSession,checkpoint: BaseCheckpointSaver):
        self.session = session
        self.checkpoint = checkpoint

    async def register_plugin(self):
        registry = PluginRegistry(self.session)
        # 这里可以实验我之前的想法:逆转state生成
        operation_builder = [
            InternalOperationBuilder("project_helper:chat")
            .param("page_id", "UUID", "页面ID", required=True)
            .param("query", "str", "用户发送的消息", required=True),
        ]
        # 使用确定性ID创建插件定义
        plugin_def = PluginDefinition.with_deterministic_id(
            source_namespace="official",          # ID生成命名空间
            plugin_name="project_helper",           # 插件名称
            loader_type=LoaderType.INTERNAL,       # 加载器类型
            operation_builders=operation_builder,  # 操作列表
            # 元数据配置
            from_type=PluginFromTypeEnum.OFFICIAL,   # 系统内置插件
            scope_type=PluginScopeTypeEnum.WORK,    # 作品作用域
            runtime_config={
                "model_name": "str",
                "base_url": "str",
                "api_key": "str",
                # "is_action": "bool",
                }, # 运行时配置
            # default_config={},                     # 默认配置
            render_type=RenderType.AGENT_MESSAGES,           # 渲染类型
            tags=["agent"]      # 功能标签
        )
        try:
            plugin_id = await registry.register_with_deterministic_id(plugin_def)
            
            log.info(f"✅ project_helper插件注册成功: - {plugin_id}")
            return plugin_id
            
        except Exception as e:
            log.error(f"❌ project_helper插件注册失败: - {e}")
            errors = registry.get_errors()
            for error in errors:
                log.error(f"Error: {error}")
            raise

    async def call(self, reuest:str,page_id:str)->BaseMessageChunk:
        """
        调用项目助手智能体
        """
        agent = await build_agent(graph=graph, checkpoint=self.checkpoint)
        async for event in agent.astream(
            {"query": reuest,"page_id":page_id},config={"thread_id": page_id},
            # context=
            # 从插件配置中加载runtime,
            stream_mode="messages",
            ):
            yield event
        

