"""
插件操作扫描器
自动扫描服务类并注册所有标记的插件操作
"""
import inspect
from typing import List, Type
from sqlalchemy.ext.asyncio import AsyncSession

from core.plugin.operation_registry import PluginOperationRegistry


async def scan_and_register_operations(service_classes: List[Type], session: AsyncSession):
    """
    扫描服务类并注册所有插件操作
    
    Args:
        service_classes: 要扫描的服务类列表
        session: 数据库会话（用于服务实例化）
    """
    for service_class in service_classes:
        # 创建服务实例
        service_instance = service_class(session)
        
        # 扫描所有方法
        for name, method in inspect.getmembers(service_class, predicate=inspect.isfunction):
            if hasattr(method, '__plugin_operation__'):
                op_config = method.__plugin_operation__
                
                # 获取绑定到实例的方法
                bound_method = getattr(service_instance, name)
                
                # 注册到全局操作注册表
                PluginOperationRegistry.register(
                    op_config['plugin_id'],
                    op_config['operation_name'],
                    bound_method
                )
                
                print(f"Registered operation: {op_config['plugin_id']}:{op_config['operation_name']}")