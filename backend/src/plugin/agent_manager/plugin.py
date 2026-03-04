from typing import List, Optional
from uuid import UUID

from core.plugin.annotations import plugin_meta, operation
from common.enums import PluginFromTypeEnum
from core.ui.layout import AppLayout, Mailbox

@plugin_meta(
    name="agent_manager",
    space="official", 
    version="0.0.1",
    description="手机",
    from_type=PluginFromTypeEnum.SYSTEM
)
class AgentManagerPlugin:
    
    @operation(
        name="mail_entry",
        description="邮箱入口",
        ui_target=AppLayout.Header.Actions.filter(),
        with_ui=["MailButton"]
    )
    async def mail_entry(self):
        """邮箱入口"""
        pass

    @operation(
        name="agent_sidebar_item",
        description="邮箱侧边栏入口",
        ui_target=Mailbox.Sidebar.filter(),
        with_ui=["AgentSidebarItem"]
    )
    async def agent_sidebar_item(self, name: str = "Agent Manager", role: str = "System"):
        """邮箱侧边栏入口"""
        pass

#     @runtime_config
#     def __init__(
#         self,
#         session: AsyncSession,
#         frontend_base_url: str | None = None,
#         mail_endpoint: str | None = None,
#         mail_api_key: str | None = None,
#     ):
#         self.session = session
#         self.frontend_base_url = frontend_base_url
#         self.mail_endpoint = mail_endpoint
#         self.mail_api_key = mail_api_key

#     def _to_agent_plugin_meta(self, plugin: PluginSQLEntity) -> AgentPluginMeta:
#         return AgentPluginMeta(
#             id=plugin.id,
#             name=plugin.name,
#             version=plugin.version,
#             description=plugin.description,
#             enabled=plugin.enabled,
#             tags=plugin.tags or [],
#         )

#     @operation
#     async def list_agent_plugins(self, limit: int = 50, offset: int = 0) -> AgentPluginListResponse:
#         stmt = (
#             select(PluginSQLEntity)
#             .where(cast(PluginSQLEntity.tags, JSONB).contains(["agent"]))
#             .offset(offset)
#             .limit(limit)
#         )
#         result = await self.session.execute(stmt)
#         plugins = result.scalars().all()

#         count_stmt = (
#             select(func.count())
#             .select_from(PluginSQLEntity)
#             .where(cast(PluginSQLEntity.tags, JSONB).contains(["agent"]))
#         )
#         total_result = await self.session.execute(count_stmt)
#         total = total_result.scalar_one()

#         return AgentPluginListResponse(
#             total=total,
#             items=[self._to_agent_plugin_meta(plugin) for plugin in plugins],
#         )

#     @operation
#     async def update_agent_plugin(self, request: AgentPluginUpdateRequest) -> AgentPluginUpdateResponse:
#         stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == request.plugin_id)
#         result = await self.session.execute(stmt)
#         plugin = result.scalar_one_or_none()
#         if not plugin:
#             raise ResourceNotFoundError(f"Plugin {request.plugin_id} not found")

#         if request.enabled is not None:
#             plugin.enabled = request.enabled
#         if request.description is not None:
#             plugin.description = request.description
#         if request.tags is not None:
#             plugin.tags = request.tags

#         await self.session.commit()
#         await self.session.refresh(plugin)

#         return AgentPluginUpdateResponse(updated=True, plugin=self._to_agent_plugin_meta(plugin))

#     @operation
#     async def get_agent_config_url(self, agent_id: str) -> AgentConfigLink:
#         base_url = self.frontend_base_url.rstrip("/") if self.frontend_base_url else ""
#         url = f"{base_url}/agents/{agent_id}" if base_url else f"/agents/{agent_id}"
#         return AgentConfigLink(agent_id=agent_id, url=url)

#     @operation
#     async def proxy_send_mail(self, request: AgentMailRequest) -> AgentMailResponse:
#         if not self.mail_endpoint:
#             return AgentMailResponse(
#                 accepted=False,
#                 status_code=0,
#                 message="mail_endpoint_not_configured",
#             )

#         headers = {}
#         if self.mail_api_key:
#             headers["Authorization"] = self.mail_api_key

#         try:
#             async with httpx.AsyncClient() as client:
#                 response = await client.post(
#                     self.mail_endpoint,
#                     json=request.model_dump(),
#                     headers=headers,
#                     timeout=10.0,
#                 )
#             if response.status_code >= 400:
#                 return AgentMailResponse(
#                     accepted=False,
#                     status_code=response.status_code,
#                     message=response.text,
#                 )
#             return AgentMailResponse(
#                 accepted=True,
#                 status_code=response.status_code,
#                 message=None,
#             )
#         except httpx.HTTPError as exc:
#             return AgentMailResponse(
#                 accepted=False,
#                 status_code=0,
#                 message=str(exc),
#             )

#     @operation
#     async def list_agent_conversations(
#         self,
#         limit: int = 50,
#         offset: int = 0,
#     ) -> AgentConversationListResponse:
#         stmt = select(AgentsManagerSQLEntity).offset(offset).limit(limit)
#         result = await self.session.execute(stmt)
#         agents = result.scalars().all()

#         count_stmt = select(func.count()).select_from(AgentsManagerSQLEntity)
#         total_result = await self.session.execute(count_stmt)
#         total = total_result.scalar_one()

#         items = [
#             AgentConversationSummary(
#                 agent_id=agent.id,
#                 session_ids=list(agent.sessions or []),
#                 session_count=len(agent.sessions or []),
#             )
#             for agent in agents
#         ]

#         return AgentConversationListResponse(total=total, items=items)

#     @operation
#     async def get_card_view(self, limit: int = 50, offset: int = 0) -> ComponentPayload:
#         """
#         获取Agent卡片视图，包含交互动作
#         """
#         stmt = (
#             select(PluginSQLEntity)
#             .where(cast(PluginSQLEntity.tags, JSONB).contains(["agent"]))
#             .offset(offset)
#             .limit(limit)
#         )
#         result = await self.session.execute(stmt)
#         plugins = result.scalars().all()

#         count_stmt = (
#             select(func.count())
#             .select_from(PluginSQLEntity)
#             .where(cast(PluginSQLEntity.tags, JSONB).contains(["agent"]))
#         )
#         total_result = await self.session.execute(count_stmt)
#         total = total_result.scalar_one()

#         grid_children = []
#         for plugin in plugins:
#             # 构建交互动作
#             actions = {
#                 "click": Action(
#                     type="invoke_operation",
#                     operation="get_agent_detail",
#                     params={"agent_id": str(plugin.id)}
#                 ),
#                 "menu": [
#                     Action(
#                         type="invoke_operation",
#                         operation="update_agent_plugin", 
#                         params={"plugin_id": str(plugin.id), "enabled": not plugin.enabled},
#                         label="禁用" if plugin.enabled else "启用"
#                     )
#                 ]
#             }
            
#             grid_children.append(ComponentSchema(
#                 type="Card",
#                 props=CardItem(
#                     id=str(plugin.id),
#                     title=plugin.name,
#                     summary=plugin.description,
#                     tags=plugin.tags or [],
#                     actions=actions
#                 ).model_dump()
#             ))

#         root = ComponentSchema(
#             type="Grid",
#             props={"columns": 3, "gap": 4},
#             children=grid_children
#         )

#         return ComponentPayload(root=root)

#     @operation
#     async def get_agent_detail(self, agent_id: str) -> ConfigPayload:
#         """
#         获取Agent详情/配置
#         """
#         stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == UUID(agent_id))
#         result = await self.session.execute(stmt)
#         plugin = result.scalar_one_or_none()
        
#         if not plugin:
#              raise ResourceNotFoundError(f"Agent {agent_id} not found")

#         # 构造配置表单 (示例)
#         fields = [
#             ConfigField(
#                 key="description",
#                 label="描述",
#                 value_type="string",
#                 value=plugin.description
#             ),
#              ConfigField(
#                 key="enabled",
#                 label="启用状态",
#                 value_type="boolean",
#                 value=plugin.enabled
#             )
#         ]

#         return ConfigPayload(
#             fields=fields,
#             actions={
#                 "save": Action(
#                     type="invoke_operation",
#                     operation="update_agent_plugin",
#                     params={"plugin_id": agent_id}
#                 )
#             }
#         )



