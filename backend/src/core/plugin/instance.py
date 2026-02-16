"""
插件运行时实例
封装插件的执行逻辑
"""
from typing import Dict, Any
from uuid import UUID

from api.routes.plugin.schema import StandardDataResponse
from common.model.plugin_definition import PluginDefinition
from core.plugin.loader import PluginLoader, create_loader


class PluginInstance:
    """插件运行时实例"""
    
    def __init__(self, plugin_def: PluginDefinition, config: Dict[str, Any]):
        # 插件结构
        self.plugin_def = plugin_def
        # 插件运行时配置参数
        self.config = config
        # 插件加载器
        self.loader: PluginLoader = create_loader(plugin_def.loader_type)
    
    async def execute(self, params: Dict[str, Any]) -> StandardDataResponse:
        """执行插件数据加载"""
        try:
            # 合并配置和运行时参数
            execution_config = {**self.config, **params}
            
            # 调用加载器
            result = await self.loader.load(execution_config)
            
            # 确保返回StandardDataResponse格式
            if not isinstance(result, StandardDataResponse):
                result = StandardDataResponse(
                    plugin_id=self.plugin_def.id,
                    render_type=self.plugin_def.render_type,
                    payload=result,
                    total=None
                )
            
            return result
            
        except Exception as e:
            # 返回错误响应，使用_empty_payload创建正确的payload结构
            from services.plugin.service import PluginService
            empty_payload = PluginService._empty_payload(self.plugin_def.render_type)
            
            # 在payload中添加错误信息
            if hasattr(empty_payload, 'cards') and isinstance(empty_payload.cards, list):
                # 对于CARD类型
                error_card = {
                    "id": "error",
                    "title": "Error",
                    "summary": str(e),
                    "tags": ["error"]
                }
                empty_payload.cards.append(error_card)
            
            return StandardDataResponse(
                plugin_id=self.plugin_def.id,
                render_type=self.plugin_def.render_type,
                payload=empty_payload,
                total=0
            )
    
    def get_info(self) -> Dict[str, Any]:
        """获取插件实例信息"""
        return {
            "plugin_id": str(self.plugin_def.id),
            "name": self.plugin_def.name,
            "loader_type": self.plugin_def.loader_type.value,
            "render_type": self.plugin_def.render_type.value,
            "scope_type": self.plugin_def.scope_type.value
        }