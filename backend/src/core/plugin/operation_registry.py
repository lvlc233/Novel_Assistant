"""
插件操作注册表
管理所有已注册的插件操作处理器
"""
from typing import Dict, Callable, Optional


class PluginOperationRegistry:
    """插件操作注册表"""
    
    _operations: Dict[str, Callable] = {}  # "plugin_id:operation_name" -> handler
    
    @classmethod
    def register(cls, plugin_id: str, operation_name: str, handler: Callable):
        """注册插件操作"""
        key = f"{plugin_id}:{operation_name}"
        cls._operations[key] = handler
    
    @classmethod
    def get_operation(cls, plugin_id: str, operation_name: str) -> Optional[Callable]:
        """获取插件操作处理器"""
        key = f"{plugin_id}:{operation_name}"
        return cls._operations.get(key)
    
    @classmethod
    def get_all_operations(cls) -> Dict[str, Callable]:
        """获取所有已注册的操作"""
        return cls._operations.copy()
    
    @classmethod
    def clear(cls):
        """清空注册表"""
        cls._operations.clear()