"""
插件管理器
负责在内存中管理插件定义和运行时实例
"""
from typing import Dict, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.plugin.schema import PluginResponse
from common.model.plugin_definition import PluginDefinition
from core.plugin.instance import PluginInstance
from services.plugin.service import PluginService

# TODO: 这个不太好啊
class PluginManager:
    """插件管理器，负责插件内存管理和调度"""
    
    def __init__(self):
        # 插件定义缓存
        self.definitions: Dict[UUID, PluginDefinition] = {}
        # 插件实例缓存（全局插件实例）
        self.instances: Dict[UUID, PluginInstance] = {}
    
    async def load_all_plugins(self, session: AsyncSession):
        """从数据库加载所有插件到内存"""
        service = PluginService(session)
        plugins = await service.get_plugin_list()
        
        for plugin_resp in plugins:
            await self._load_plugin(plugin_resp, session)
    
    async def _load_plugin(self, plugin_resp: PluginResponse, session: AsyncSession):
        """加载单个插件"""
        try:
            # 获取完整插件详情
            service = PluginService(session)
            plugin_detail = await service.get_plugin_detail(plugin_resp.id)
            
            # 转换为PluginDefinition:从Resposne模型转化为:_>还是得提取为service模型,不能让Response模型直接进入Service...
            plugin_def = PluginDefinition(
                id=plugin_detail.id,
                name=plugin_detail.name,
                version="1.0.0",  # TODO: 从数据库获取版本信息
                description=plugin_detail.description,
                from_type=plugin_detail.from_type,
                scope_type=plugin_detail.scope_type,
                loader_type=plugin_detail.data_source_type,
                runtime_config=plugin_detail.config.model_dump() if plugin_detail.config else {},
                default_config=plugin_detail.config.model_dump() if plugin_detail.config else {},
                plugin_operation_schema={},
                render_type=plugin_detail.render_type,
                tags=plugin_detail.tags
            )
            
            self.definitions[plugin_def.id] = plugin_def
            
        
            instance = PluginInstance(plugin_def, plugin_detail.config.model_dump())
            self.instances[plugin_def.id] = instance
                
        except Exception as e:
            print(f"Failed to load plugin {plugin_resp.id}: {e}")
    
    async def get_instance(self, plugin_id: UUID) -> Optional[PluginInstance]:
        """获取插件实例（懒加载）"""
        if plugin_id in self.instances:
            return self.instances[plugin_id]
        
        # 检查插件定义是否存在
        plugin_def = self.definitions.get(plugin_id)
        if not plugin_def:
            return None
            
        # 懒加载创建实例
        instance = PluginInstance(plugin_def, {})
        self.instances[plugin_id] = instance
        return instance
    
    async def cleanup(self):
        """清理所有插件实例"""
        self.instances.clear()
        self.definitions.clear()
    
    def get_plugin_definition(self, plugin_id: UUID) -> Optional[PluginDefinition]:
        """获取插件定义"""
        return self.definitions.get(plugin_id)
    
    def list_plugins(self) -> list[PluginDefinition]:
        """列出所有插件定义"""
        return list(self.definitions.values())