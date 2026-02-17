"""
插件操作装饰器模块
用于标记服务方法为插件操作，并自动注册到操作注册表
"""
from functools import wraps
from typing import Callable, Dict, Any, Type, Optional
from uuid import UUID


# def plugin_operation(plugin_id: UUID, operation_name: str, 
#                     request_model: Optional[Type] = None, 
#                     response_model: Optional[Type] = None):
#     """
#     插件操作装饰器
    
#     Args:
#         plugin_id: 插件UUID
#         operation_name: 操作名称（唯一标识）
#         request_model: 请求模型类（可选）
#         response_model: 响应模型类（可选）
#     """
#     def decorator(func: Callable):
#         @wraps(func)
#         async def wrapper(*args, **kwargs):
#             # 保留原有逻辑
#             return await func(*args, **kwargs)
        
#         # 添加插件操作元数据
#         wrapper.__plugin_operation__ = {
#             "plugin_id": str(plugin_id),
#             "operation_name": operation_name,
#             "request_model": request_model,
#             "response_model": response_model,
#             "original_func": func
#         }
#         return wrapper
#     return decorator