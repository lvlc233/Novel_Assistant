"""Plugin Service Module."""
import inspect
from typing import Any, Dict, List
from uuid import UUID

import httpx
from pydantic import BaseModel, TypeAdapter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.plugin.schema import (
    AgentMessagesPayload,
    CardPayload,
    ConfigPayload,
    DataSourceConfig,
    InternalDataSourceConfig,
    JsonDataSourceConfig,
    PluginConfig,
    PluginConfigItem,
    PluginMetaResponse,
    PluginOperationInvokeResponse,
    PluginResponse,
    PluginUpdateRequest,
    StandardDataResponse,
    UrlDataSourceConfig,
)
from common.enums import LoaderType, PluginFromTypeEnum, PluginScopeTypeEnum, RenderType
from common.errors import ResourceNotFoundError
from core.plugin.runtime import PluginInternalRegistry
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
        return CardPayload(cards=[])

    async def get_plugin_list(self) -> List[PluginMetaResponse]:
        """获取所有插件列表."""
        stmt = select(PluginSQLEntity)
        result = await self.session.execute(stmt)
        plugins = result.scalars().all()
        
        return [
            PluginMetaResponse(
                id=plugin.id,
                name=plugin.name,
                version=plugin.version,
                description=plugin.description,
                enabled=plugin.enabled,
                render_type=RenderType(plugin.render_type)
            ) for plugin in plugins
        ]

    async def get_system_plugins(self) -> List[PluginResponse]:
        """获取系统插件列表 (SYSTEM)."""
        stmt = select(PluginSQLEntity).where(
            PluginSQLEntity.from_type == PluginFromTypeEnum.SYSTEM.value,
            PluginSQLEntity.name != "agent_manager",
        )
        result = await self.session.execute(stmt)
        plugins = result.scalars().all()
        
        return [
            PluginResponse(
                id=plugin.id,
                name=plugin.name,
                description=plugin.description,
                enabled=plugin.enabled,
                config=self._to_plugin_config(plugin.default_config),
                data_source_type=LoaderType(plugin.data_source_type) if plugin.data_source_type else None,
                data_source_config=self._to_data_source_config(plugin),
                render_type=RenderType(plugin.render_type),
                auth_config=self._to_plugin_config(plugin.auth_config) if plugin.auth_config else None,
                from_type=PluginFromTypeEnum(plugin.from_type),
                scope_type=PluginScopeTypeEnum(plugin.scope_type),
                tags=plugin.tags
            ) for plugin in plugins
        ]

    async def get_expand_plugins(self) -> List[PluginMetaResponse]:
        """获取扩展插件列表 (SYSTEM, OFFICIAL, CUSTOM)."""
        stmt = select(PluginSQLEntity).where(
            PluginSQLEntity.from_type.in_([
                PluginFromTypeEnum.SYSTEM.value,
                PluginFromTypeEnum.OFFICIAL.value,
                PluginFromTypeEnum.CUSTOM.value
            ])
        )
        result = await self.session.execute(stmt)
        plugins = result.scalars().all()
        
        return [
            PluginMetaResponse(
                id=plugin.id,
                name=plugin.name,
                version=plugin.version,
                description=plugin.description,
                enabled=plugin.enabled,
                render_type=RenderType(plugin.render_type)
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
            data_source_type=LoaderType(plugin.data_source_type) if plugin.data_source_type else None,
            data_source_config=self._to_data_source_config(plugin),
            render_type=RenderType(plugin.render_type),
            auth_config=self._to_plugin_config(plugin.auth_config) if plugin.auth_config else None,
            from_type=PluginFromTypeEnum(plugin.from_type),
            scope_type=PluginScopeTypeEnum(plugin.scope_type),
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
            if request.enabled is False and plugin.from_type == PluginFromTypeEnum.SYSTEM.value:
                # System plugins cannot be disabled
                raise ValueError("System plugins cannot be disabled")
            plugin.enabled = request.enabled
            
        if request.config is not None:
            plugin.default_config = self._to_config_dict(request.config)

        if request.data_source_type is not None:
            plugin.data_source_type = request.data_source_type.value

        if request.data_source_config is not None:
            plugin.data_source_config = request.data_source_config.model_dump()
            if request.data_source_type is None:
                plugin.data_source_type = request.data_source_config.type.value
            
        if request.auth_config is not None:
            plugin.auth_config = self._to_config_dict(request.auth_config)
            
        await self.session.commit()

    async def _invoke_plugin_operation(
        self,
        plugin_id: UUID,
        operation_name: str,
        params: Dict[str, Any],
        runtime_config: Dict[str, Any] | None,
        registry: PluginInternalRegistry
    ) -> PluginOperationInvokeResponse:
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        if not plugin:
            raise ResourceNotFoundError(f"Plugin {plugin_id} not found")
        if not plugin.enabled:
            raise ValueError(f"Plugin {plugin.name} is disabled")

        wrapper = registry.get_plugin_wrapper(plugin_id)
        if wrapper is None:
            raise ResourceNotFoundError(f"Plugin {plugin_id} not found in internal registry")

        merged_config: Dict[str, Any] = {}
        if isinstance(plugin.default_config, dict):
            merged_config.update(plugin.default_config)
        if runtime_config:
            merged_config.update(runtime_config)

        signature = inspect.signature(wrapper.plugin_cls.__init__)
        runtime_kwargs: Dict[str, Any] = {}
        for name in signature.parameters:
            if name == "self":
                continue
            if name == "session":
                runtime_kwargs[name] = self.session
                continue
            if name in merged_config:
                runtime_kwargs[name] = merged_config[name]

        instance = wrapper.create_instance(**runtime_kwargs)
        result_value = wrapper.invoke(instance, operation_name, **(params or {}))
        if inspect.iscoroutine(result_value):
            result_value = await result_value

        if isinstance(result_value, BaseModel):
            payload: Any = result_value.model_dump()
        elif isinstance(result_value, list):
            payload = [
                item.model_dump() if isinstance(item, BaseModel) else item
                for item in result_value
            ]
        else:
            payload = result_value

        return PluginOperationInvokeResponse(
            plugin_id=plugin_id,
            operation=operation_name,
            render_type=RenderType(plugin.render_type),
            payload=payload
        )

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
