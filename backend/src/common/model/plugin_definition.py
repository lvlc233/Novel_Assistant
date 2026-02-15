"""
插件定义模型
用于描述插件的完整配置信息
"""
from __future__ import annotations
from typing import Dict, Any, List, Optional
from uuid import UUID
from pydantic import BaseModel

from common.enums import LoaderType, PluginFromTypeEnum, PluginScopeTypeEnum, RenderType
from common.model.base_plugin_models import BaseOperationBuilder
from common.utils.plugin import build_plugin_id


class PluginDefinition(BaseModel):
    """插件定义模型"""
    
    id: UUID
    name: str
    version: str = "1.0.0"
    description: Optional[str] = None
    from_type: PluginFromTypeEnum
    scope_type: PluginScopeTypeEnum
    loader_type: LoaderType
    runtime_config: Dict[str, Any] = {}
    default_config: Dict[str, Any] = {}
    plugin_operation_schema: Dict[str, Any] = {}
    render_type: RenderType
    tags: List[str] = []
    
    @classmethod
    def from_operation_builders(cls, 
                              plugin_id: UUID,
                              plugin_name: str,
                              loader_type: LoaderType,
                              operation_builders: List[BaseOperationBuilder],
                              **kwargs) -> 'PluginDefinition':
        """从操作构建器创建插件定义"""
        operations_schema = [builder.build_schema() for builder in operation_builders]
        
        return cls(
            id=plugin_id,
            name=plugin_name,
            loader_type=loader_type,
            plugin_operation_schema={"operations": operations_schema},
            **kwargs
        )
    
    @classmethod
    def with_deterministic_id(cls,
                            source_namespace: str,
                            plugin_name: str,
                            loader_type: LoaderType,
                            operation_builders: List[BaseOperationBuilder],
                            **kwargs) -> 'PluginDefinition':
        """
        使用确定性ID创建插件定义
        
        :param source_namespace: 来源命名空间（如: "official", "user_123"）
        :param plugin_name: 插件名称
        :param loader_type: 加载器类型
        :param operation_builders: 操作构建器列表
        """
        plugin_id = build_plugin_id(source_namespace, plugin_name)
        operations_schema = [builder.build_schema() for builder in operation_builders]
        
        return cls(
            id=plugin_id,
            name=plugin_name,
            loader_type=loader_type,
            plugin_operation_schema={"operations": operations_schema},
            **kwargs
        )