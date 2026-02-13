"""Plugin Service Module."""
from typing import List, Dict, Any
from uuid import UUID

import httpx
from pydantic import TypeAdapter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.plugin.schema import (
    DataSourceConfig,
    UrlDataSourceConfig,
    CheckpointDataSourceConfig,
    JsonDataSourceConfig,
    InternalDataSourceConfig,
    PluginConfig,
    PluginConfigItem,
    ConfigPayload,
    AgentMessagesPayload,
    CardPayload,
    ListPayload,
    DetailPayload,
    DetailItem,
    DashboardPayload,
    PluginMetaResponse,
    PluginResponse,
    PluginUpdateRequest,
    StandardDataResponse
)
from common.enums import PluginFromTypeEnum, RenderType
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import PluginSQLEntity


class PluginService:
    """插件服务类."""
    def __init__(self, session: AsyncSession):
        """Initialize PluginService."""
        self.session = session

    @staticmethod
    def _to_plugin_config(config: Dict[str, Any] | None) -> PluginConfig:
        if not config:
            return PluginConfig()
        items = []
        for key, value in config.items():
            if isinstance(value, (str, int, float, bool)) or value is None:
                items.append(PluginConfigItem(key=str(key), value=value))
            else:
                items.append(PluginConfigItem(key=str(key), value=str(value)))
        return PluginConfig(items=items)

    @staticmethod
    def _to_config_dict(config: PluginConfig | None) -> Dict[str, Any]:
        if not config:
            return {}
        return {item.key: item.value for item in config.items}

    @staticmethod
    def _to_data_source_config(plugin: PluginSQLEntity) -> DataSourceConfig | None:
        if plugin.data_source_config:
            adapter = TypeAdapter(DataSourceConfig)
            return adapter.validate_python(plugin.data_source_config)
        return None

    @staticmethod
    def _empty_payload(render_type: RenderType):
        if render_type == RenderType.CONFIG:
            return ConfigPayload(fields=[])
        if render_type == RenderType.AGENT_MESSAGES:
            return AgentMessagesPayload(sessions=[])
        if render_type == RenderType.CARD:
            return CardPayload(cards=[])
        if render_type == RenderType.DETAIL:
            return DetailPayload(detail=DetailItem(id="", title="", content=None, fields=[]))
        if render_type == RenderType.DASHBOARD:
            return DashboardPayload(widgets=[])
        return ListPayload(items=[])

    async def get_plugin_list(self) -> List[PluginMetaResponse]:
        """获取所有插件列表."""
        stmt = select(PluginSQLEntity)
        result = await self.session.execute(stmt)
        plugins = result.scalars().all()
        
        return [
            PluginMetaResponse(
                id=plugin.id,
                name=plugin.name,
                enabled=plugin.enabled,
                render_type=plugin.render_type
            ) for plugin in plugins
        ]

    async def get_system_plugins(self) -> List[PluginResponse]:
        """获取系统插件列表 (SYSTEM)."""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.from_type == PluginFromTypeEnum.SYSTEM)
        result = await self.session.execute(stmt)
        plugins = result.scalars().all()
        
        return [
            PluginResponse(
                id=plugin.id,
                name=plugin.name,
                description=plugin.description,
                enabled=plugin.enabled,
                config=self._to_plugin_config(plugin.default_config),
                data_source_type=plugin.data_source_type,
                data_source_config=self._to_data_source_config(plugin),
                render_type=plugin.render_type,
                auth_config=self._to_plugin_config(plugin.auth_config) if plugin.auth_config else None,
                from_type=plugin.from_type,
                scope_type=plugin.scope_type,
                tags=plugin.tags
            ) for plugin in plugins
        ]

    async def get_expand_plugins(self) -> List[PluginMetaResponse]:
        """获取扩展插件列表 (OFFICIAL, CUSTOM)."""
        stmt = select(PluginSQLEntity).where(
            PluginSQLEntity.from_type.in_([PluginFromTypeEnum.OFFICIAL, PluginFromTypeEnum.CUSTOM])
        )
        result = await self.session.execute(stmt)
        plugins = result.scalars().all()
        
        return [
            PluginMetaResponse(
                id=plugin.id,
                name=plugin.name,
                enabled=plugin.enabled,
                render_type=plugin.render_type
            ) for plugin in plugins
        ]

    async def get_plugin_detail(self, plugin_id: UUID) -> PluginResponse:
        """获取插件详情."""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            raise ResourceNotFoundError(f"Plugin with id {plugin_id} not found")
            
        return PluginResponse(
            id=plugin.id,
            name=plugin.name,
            description=plugin.description,
            enabled=plugin.enabled,
            config=self._to_plugin_config(plugin.default_config),
            data_source_type=plugin.data_source_type,
            data_source_config=self._to_data_source_config(plugin),
            render_type=plugin.render_type,
            auth_config=self._to_plugin_config(plugin.auth_config) if plugin.auth_config else None,
            from_type=plugin.from_type,
            scope_type=plugin.scope_type,
            tags=plugin.tags
        )

    async def update_plugin(self, plugin_id: UUID, request: PluginUpdateRequest) -> None:
        """更新插件配置(全局设置)."""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            raise ResourceNotFoundError(f"Plugin with id {plugin_id} not found")
            
        if request.enabled is not None:
            if request.enabled is False and plugin.from_type == PluginFromTypeEnum.SYSTEM:
                # System plugins cannot be disabled
                raise ValueError("System plugins cannot be disabled")
            plugin.enabled = request.enabled
            
        if request.config is not None:
            plugin.default_config = self._to_config_dict(request.config)

        if request.data_source_type is not None:
            plugin.data_source_type = request.data_source_type

        if request.data_source_config is not None:
            plugin.data_source_config = request.data_source_config.model_dump()
            if request.data_source_type is None:
                plugin.data_source_type = request.data_source_config.type
            
        if request.auth_config is not None:
            plugin.auth_config = self._to_config_dict(request.auth_config)
            
        await self.session.commit()

    async def proxy_plugin_data(self, plugin_id: UUID, params: Dict[str, Any]) -> StandardDataResponse:
        """BFF Proxy for plugin data."""
        # 1. Get Plugin Config
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            raise ResourceNotFoundError(f"Plugin {plugin_id} not found")
            
        if not plugin.enabled:
             raise ValueError(f"Plugin {plugin.name} is disabled")

        data_source_type = plugin.data_source_type
        data_source_config = self._to_data_source_config(plugin)

        if data_source_type is None or data_source_config is None:
            return StandardDataResponse(
                plugin_id=plugin_id,
                render_type=plugin.render_type,
                payload=self._empty_payload(plugin.render_type),
                total=0
            )

        if isinstance(data_source_config, JsonDataSourceConfig):
            return StandardDataResponse(
                plugin_id=plugin_id,
                render_type=plugin.render_type,
                payload=data_source_config.payload,
                total=None
            )

        if isinstance(data_source_config, CheckpointDataSourceConfig):
            return StandardDataResponse(
                plugin_id=plugin_id,
                render_type=plugin.render_type,
                payload=self._empty_payload(plugin.render_type),
                total=0
            )

        url = None
        if isinstance(data_source_config, UrlDataSourceConfig):
            url = data_source_config.url
        if isinstance(data_source_config, InternalDataSourceConfig):
            url = data_source_config.endpoint
        if not url:
            return StandardDataResponse(
                plugin_id=plugin_id,
                render_type=plugin.render_type,
                payload=self._empty_payload(plugin.render_type),
                total=0
            )

        headers: Dict[str, str] = {}
        if plugin.auth_config:
            if isinstance(plugin.auth_config, dict):
                key = plugin.auth_config.get("header_key", "Authorization")
                value = plugin.auth_config.get("api_key", "")
                if key and value:
                    headers[key] = value

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                return StandardDataResponse.model_validate(data)
            except httpx.HTTPError as e:
                raise ValueError(f"Upstream service error: {str(e)}")

