"""Plugin Service Module."""
import inspect
from typing import Any, Dict, List
from uuid import UUID

import httpx
from pydantic import BaseModel, TypeAdapter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.plugin.schema import (
    PluginMetaResponse,
    PluginOperationInvokeResponse,
    PluginResponse,
    PluginOperation,
    PluginUpdateRequest,
)
from common.enums import LoaderType, PluginFromTypeEnum
from common.errors import ResourceNotFoundError
from core.plugin.runtime import PluginInternalRegistry
from core.plugin.di import DependencyInfo
from infrastructure.pg.pg_models import PluginSQLEntity


class PluginService:
    """插件服务类."""
    def __init__(self, session: AsyncSession):
        """Initialize PluginService."""
        self.session = session

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
                config=plugin.default_config or {},
                config_schema=plugin.runtime_config or {},
                from_type=PluginFromTypeEnum(plugin.from_type),
                tags=plugin.tags or [],
                operations=[
                    PluginOperation(
                        name=name,
                        description=op.get("description"),
                        input_schema=op.get("input_schema", {}),
                        output_schema=op.get("output_schema"),
                        with_ui=op.get("with_ui", []),
                        ui_target=op.get("ui_target"),
                        trigger=op.get("trigger"),
                        is_stream=op.get("is_stream", False)
                    )
                    for name, op in (plugin.plugin_operation_schema or {}).get("operations", {}).items()
                ]
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
            ) for plugin in plugins
        ]

    async def get_plugin_detail(self, plugin_id: UUID):
        """获取插件详情."""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            raise ResourceNotFoundError(f"Plugin with id {plugin_id} not found")
            
        # 转换 operations
        operations = []
        if plugin.plugin_operation_schema:
            ops_dict = plugin.plugin_operation_schema.get("operations", {})
            for op_name, op_info in ops_dict.items():
                 operations.append(PluginOperation(
                     name=op_name,
                     description=op_info.get("description"),
                     with_ui=op_info.get("with_ui", []),
                     ui_target=op_info.get("ui_target"),
                     trigger=op_info.get("trigger"),
                     is_stream=op_info.get("is_stream", False),
                     input_schema=op_info.get("input_schema", {}),
                     output_schema=op_info.get("output_schema")
                 ))
                 
        return PluginResponse(
            id=plugin.id,
            name=plugin.name,
            description=plugin.description,
            enabled=plugin.enabled,
            from_type=PluginFromTypeEnum(plugin.from_type),
            operations=operations,
            config=plugin.default_config or {},
            config_schema=plugin.runtime_config or {},
            tags=plugin.tags or []
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
            plugin.default_config = request.config # self._to_config_dict(request.config)
            
        if request.auth_config is not None:
            plugin.auth_config = request.auth_config # self._to_config_dict(request.auth_config)
            
        await self.session.commit()

    async def invoke_plugin_operation(
        self,
        plugin_id: UUID,
        operation_name: str,
        params: Dict[str, Any],
        # runtime_config: Dict[str, Any] | None,
        registry: PluginInternalRegistry
    ) -> Any:
        # 从数据库中获取插件的信息(用于获取运行时配置)
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        if not plugin:
            raise ResourceNotFoundError(f"Plugin {plugin_id} not found")
        if not plugin.enabled:
            raise ValueError(f"Plugin {plugin.name} is disabled")

        # 获取该插件的包装器(也就是配置信息到实际内存映射)
        wrapper = registry.get_plugin_wrapper(plugin_id)
        if wrapper is None:
            raise ResourceNotFoundError(f"Plugin {plugin_id} not found in internal registry")
        # 读取运行时配置
        merged_config = plugin.default_config or {}
    
        # 获取插件的__init__配置签名
        signature = inspect.signature(wrapper.plugin_cls.__init__)
        runtime_kwargs: Dict[str, Any] = {}
        # 获取基于注入的参数列表
        injections = getattr(wrapper, "injections", {})
        
        cleanup_tasks = []

        async def perform_cleanup():
            for task in cleanup_tasks:
                try:
                    await task()
                except Exception as e:
                    print(f"Error during cleanup: {e}")

        try:
            # 处理初始化函数的来源信息
            for name in signature.parameters:
                # 跳过首个参数
                if name == "self":
                    continue
                
                # Dependency Injection
                if name in injections:
                    dep_info = injections[name]
                    if dep_info.dependency: # 获取注入函数
                        try:
                            # 直接调用依赖函数，不传递任何参数
                            # 依赖函数内部负责获取所需资源（如通过 contextvars 或全局配置）
                            dep_instance = dep_info.dependency()
                            
                            # 处理异步生成器 (如 get_session)
                            if inspect.isasyncgen(dep_instance):
                                gen = dep_instance
                                dep_instance = await gen.__anext__()
                                cleanup_tasks.append(gen.aclose)
                            # 处理普通生成器
                            elif inspect.isgenerator(dep_instance):
                                dep_instance = next(dep_instance)
                            # 处理协程
                            elif inspect.iscoroutine(dep_instance):
                                dep_instance = await dep_instance
                            # 将注入的信息注入到运行时的参数中
                            runtime_kwargs[name] = dep_instance
                        except Exception as e:
                            # Fallback or re-raise
                            print(f"Warning: Failed to inject dependency '{name}': {e}")
                    continue
                
                # 将一般的插件配置信息注入到运行时参数中
                if name in merged_config:
                    runtime_kwargs[name] = merged_config[name]

            # 创建插件实例
            instance = wrapper.create_instance(**runtime_kwargs)
            # 调度插件的指定操作(并传递参数)
            result_value = wrapper.invoke(instance, operation_name, **(params or {}))
            
            if inspect.iscoroutine(result_value):
                result_value = await result_value

            # 如果是异步生成器，直接返回，交给 Router 处理 StreamingResponse
            if inspect.isasyncgen(result_value):
                async def wrapped_gen():
                    try:
                        async for item in result_value:
                            yield item
                    finally:
                        await perform_cleanup()
                return wrapped_gen()

            if isinstance(result_value, BaseModel):
                payload: Any = result_value.model_dump()
            elif isinstance(result_value, list):
                payload = [
                    item.model_dump() if isinstance(item, BaseModel) else item
                    for item in result_value
                ]
            else:
                payload = result_value
            
            await perform_cleanup()

            return PluginOperationInvokeResponse(
                plugin_id=plugin_id,
                operation=operation_name,
                payload=payload
            )
        except Exception:
            await perform_cleanup()
            raise

    # async def proxy_plugin_data(self, plugin_id: UUID, params: Dict[str, Any]):
        # """BFF Proxy for plugin data."""
        # # 1. Get Plugin Config
        # stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        # result = await self.session.execute(stmt)
        # plugin = result.scalar_one_or_none()
        
        # if not plugin:
        #     raise ResourceNotFoundError(f"Plugin {plugin_id} not found")
            
        # if not plugin.enabled:
        #      raise ValueError(f"Plugin {plugin.name} is disabled")

        # data_source_type = plugin.data_source_type
        # data_source_config = self._to_data_source_config(plugin)

        # if data_source_type is None or data_source_config is None:
        #     return StandardDataResponse(
        #         plugin_id=plugin_id,
        #         render_type=plugin.render_type,
        #         payload=self._empty_payload(plugin.render_type),
        #         total=0
        #     )

        # if isinstance(data_source_config, JsonDataSourceConfig):
        #     return StandardDataResponse(
        #         plugin_id=plugin_id,
        #         render_type=plugin.render_type,
        #         payload=data_source_config.payload,
        #         total=None
        #     )



        # url = None
        # if isinstance(data_source_config, UrlDataSourceConfig):
        #     url = data_source_config.url
        # if isinstance(data_source_config, InternalDataSourceConfig):
        #     url = data_source_config.endpoint
        # if not url:
        #     return StandardDataResponse(
        #         plugin_id=plugin_id,
        #         render_type=plugin.render_type,
        #         payload=self._empty_payload(plugin.render_type),
        #         total=0
        #     )

        # headers: Dict[str, str] = {}
        # if plugin.auth_config:
        #     if isinstance(plugin.auth_config, dict):
        #         key = plugin.auth_config.get("header_key", "Authorization")
        #         value = plugin.auth_config.get("api_key", "")
        #         if key and value:
        #             headers[key] = value

        # async with httpx.AsyncClient() as client:
        #     try:
        #         response = await client.get(url, params=params, headers=headers, timeout=10.0)
        #         response.raise_for_status()
        #         data = response.json()
        #         return StandardDataResponse.model_validate(data)
        #     except httpx.HTTPError as e:
        #         raise ValueError(f"Upstream service error: {str(e)}")
