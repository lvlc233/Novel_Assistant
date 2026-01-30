from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.plugin.schema import (
    PluginMetaResponse,
    PluginResponse,
    PluginUpdateRequest,
)
from common.errors import ResourceNotFoundError
from infrastructure.pg.pg_models import PluginSQLEntity


class PluginService:
    def __init__(self, session: AsyncSession):
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
                enabled=plugin.enabled,
                description=plugin.description,
                from_type=plugin.from_type,
                scope_type=plugin.scope_type
            ) for plugin in plugins
        ]

    async def get_plugin_detail(self, plugin_id: UUID) -> PluginResponse:
        """获取插件详情."""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == str(plugin_id))
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            raise ResourceNotFoundError(f"Plugin with id {plugin_id} not found")
            
        return PluginResponse(
            id=plugin.id,
            name=plugin.name,
            description=plugin.description,
            enabled=plugin.enabled,
            config=plugin.default_config, # 返回默认配置作为基础配置
            from_type=plugin.from_type,
            scope_type=plugin.scope_type,
            tags=plugin.tags
        )

    async def update_plugin(self, plugin_id: UUID, request: PluginUpdateRequest) -> None:
        """更新插件配置(全局设置)."""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == str(plugin_id))
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            raise ResourceNotFoundError(f"Plugin with id {plugin_id} not found")
            
        if request.enabled is not None:
            plugin.enabled = request.enabled
            
        if request.config is not None:
            # 更新默认配置
            # TODO: Validate against config_schema if needed
            plugin.default_config = request.config
            
        await self.session.commit()

    # async def delete_plugin(self, plugin_id: UUID) -> None:
    #     """卸载插件"""
    #     # Note: Depending on business logic, we might only mark it as 'uninstalled' or remove from registry.
    #     # Assuming physical deletion from database for 'uninstall' here.
    #     stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == str(plugin_id))
    #     result = await self.session.execute(stmt)
    #     plugin = result.scalar_one_or_none()
        
    #     if not plugin:
    #         raise ResourceNotFoundError(f"Plugin {plugin_id} not found")
            
    #     await self.session.delete(plugin)
    #     await self.session.commit()
