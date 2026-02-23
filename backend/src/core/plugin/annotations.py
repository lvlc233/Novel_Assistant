"""
三注解系统实现
@plugin, @config, @operation
"""
from __future__ import annotations
from typing import Dict, Any, Optional, List, Union, Callable, get_type_hints
from dataclasses import dataclass
from inspect import signature, Parameter
import inspect
from common.enums import LoaderType, RenderType, PluginFromTypeEnum, PluginScopeTypeEnum
from core.plugin.base.models import PluginDefinition
from core.plugin.utils import build_plugin_id

"""构建流程
类定义开始
    │
    ▼
┌─────────────────┐
│ 定义__init__方法  │
│ 应用@runtime_config│
│                 │
│ 1. signature()解析参数 │
│ 2. get_type_hints()获取类型 │
│ 3. 生成config_schema字典 │
│ 4. 存入__init__.__plugin_config_schema__ │
│ 5. 返回原__init__ │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 定义get_current方法│
│ 应用@operation    │
│                 │
│ 1. signature()解析参数 │
│ 2. 生成input_schema/output_schema │
│ 3. 创建OperationInfo对象 │
│ 4. 存入func.__plugin_operation__ │
│ 5. 返回原函数 │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 类定义完成        │
│ 应用@plugin_meta  │
│                 │
│ 1. 准备metadata字典（名称、版本等） │
│ 2. 读取__init__.__plugin_config_schema__ → config_schema │
│ 3. _collect_operations(cls)扫描所有方法 │
│    └── 找到有__plugin_operation__的方法 │
│    └── 收集到operations字典 │
│ 4. 创建PluginWrapper实例 │
│    └── 整合：metadata + config_schema + operations │
│ 5. 存入cls.__plugin_wrapper__ │
│ 6. 返回类 │
└─────────────────┘
    │
    ▼
类定义完成，可以使用

"""



@dataclass
class OperationInfo:
    """操作信息"""
    name: str
    description: Optional[str] = None
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    func: Optional[Callable] = None


@dataclass
class ConfigInfo:
    """配置信息"""
    schema: Dict[str, Any]
    init_func: Optional[Callable] = None


@dataclass
class PluginWrapper:
    plugin_cls: type
    metadata: Dict[str, Any]
    config_schema: Dict[str, Any]
    operations: Dict[str, OperationInfo]

    def build_definition(self) -> PluginDefinition:
        operations_schema = {
            name: {
                "description": info.description,
                "input_schema": info.input_schema,
                "output_schema": info.output_schema,
            }
            for name, info in self.operations.items()
        }
        return PluginDefinition(
            id=build_plugin_id(self.metadata["space"], self.metadata["name"]),
            name=self.metadata["name"],
            version=self.metadata["version"],
            description=self.metadata["description"],
            loader_type=self.metadata["loader_type"],
            render_type=self.metadata["render_type"],
            from_type=self.metadata["from_type"],
            scope_type=self.metadata["scope_type"],
            config_schema=self.config_schema,
            plugin_operation_schema={"operations": operations_schema},
            tags=self.metadata["tags"],
            data_source_entry_point=self.metadata["data_source_entry_point"]
        )

    def create_instance(self, **kwargs):
        return self.plugin_cls(**kwargs)

    def invoke(self, instance, operation_name: str, **kwargs):
        op = self.operations.get(operation_name)
        if op is None or op.func is None:
            raise ValueError(f"Operation '{operation_name}' not found")
        return op.func(instance, **kwargs)


def _collect_operations(cls) -> Dict[str, OperationInfo]:
    operations: Dict[str, OperationInfo] = {}
    for _, method in inspect.getmembers(cls, inspect.isfunction):
        if hasattr(method, '__plugin_operation__'):
            op_info = method.__plugin_operation__
            operations[op_info.name] = op_info
    return operations


def plugin_meta(
    name: str,                                                  # 插件名称
    space: str,                                                 # 插件命名空间
    scope_type: PluginScopeTypeEnum,                            # 作用域类型
    version: str = "1.0.0",                                     # 插件版本  
    description: Optional[str] = None,                          # 插件描述
    render_type: RenderType = RenderType.CARD,                 # 渲染类型
    from_type: PluginFromTypeEnum = PluginFromTypeEnum.OFFICIAL,
    tags: List[str] = None,
    data_source_entry_point: Optional[str] = None
):
    """
    插件元数据装饰器
    
    Args:
        name: 插件名称
        space: 插件命名空间
        version: 版本号
        description: 插件描述
        loader_type: 加载器类型
        render_type: 渲染类型
        from_type: 来源类型
        scope_type: 作用域类型
        tags: 标签列表
        data_source_entry_point: 数据源入口操作名称
    cls: with 
        __plugin_metadata__
        __plugin_config__
        __plugin_operations__
        __plugin_wrapper__
    """
    if tags is None:
        tags = []
    
    def decorator(cls):
        # 收集元信息
        # 元信息
        cls.__plugin_metadata__ = {
            "name": name,
            "space": space,
            "version": version,
            "description": description,
            "loader_type": LoaderType.INTERNAL,
            "render_type": render_type,
            "from_type": from_type,
            "scope_type": scope_type,
            "tags": tags,
            "data_source_entry_point": data_source_entry_point
        }
        config_schema = {}
        # 收集配置信息->基于runtime_config装饰器,从__init__方法参数中收集
        if hasattr(cls.__init__, '__plugin_config_schema__'):
            config_schema = cls.__init__.__plugin_config_schema__
        
        cls.__plugin_config__ = ConfigInfo(
            schema=config_schema,
            init_func=cls.__init__
        )
        operations = _collect_operations(cls)
        cls.__plugin_operations__ = operations
        cls.__plugin_wrapper__ = PluginWrapper(
            plugin_cls=cls,
            metadata=cls.__plugin_metadata__,
            config_schema=config_schema,
            operations=operations,
        )
        return cls
    
    return decorator


def runtime_config(init_func: Callable):
    """
    配置初始化装饰器
    自动从__init__方法参数生成配置schema
    
    Args:
        init_func: 初始化方法，通常是__init__

    init:with __plugin_config_schema__
    """
    # 解析__init__方法的参数
    # 获取函数签名
    sig = signature(init_func)
    config_schema = {}
    
    for param_name, param in sig.parameters.items():
        if param_name == 'self':
            continue
            
        # 获取参数类型
        type_hints = get_type_hints(init_func)
        param_type = type_hints.get(param_name, Any)
        
        # 构建参数schema
        param_schema = {
            "type": _map_python_type_to_json(param_type),
            "required": param.default is Parameter.empty,
        }
        
        if param.default is not Parameter.empty:
            param_schema["default"] = param.default
        
        config_schema[param_name] = param_schema
    
    # 存储配置信息到函数属性
    init_func.__plugin_config_schema__ = config_schema
    
    return init_func


def operation(name: Union[str, Callable, None] = None, description: Optional[str] = None):
    """
    操作接口装饰器
    支持:
    @operation
    @operation()
    @operation(name="op_name")
    """
    def _process(func, op_name, op_desc):
        real_name = op_name or func.__name__
        real_desc = op_desc or func.__doc__
        
        # 获取函数类型提示
        type_hints = get_type_hints(func)
        
        # 解析函数参数生成input_schema
        sig = signature(func)
        input_schema = {}
        
        for param_name, param in sig.parameters.items():
            if param_name == 'self':
                continue
                
            # 获取参数类型
            param_type = type_hints.get(param_name, Any)
            
            param_schema = {
                "type": _map_python_type_to_json(param_type),
                "required": param.default is Parameter.empty,
            }
            
            if param.default is not Parameter.empty:
                param_schema["default"] = param.default
            
            input_schema[param_name] = param_schema
        
        # 解析返回类型生成output_schema
        return_type = type_hints.get('return', Dict[str, Any])
        output_schema = {
            "type": _map_python_type_to_json(return_type)
        }
        
        # 创建操作信息
        op_info = OperationInfo(
            name=real_name,
            description=real_desc,
            input_schema=input_schema,
            output_schema=output_schema,
            func=func
        )
        
        # 存储操作信息
        if not hasattr(func, '__plugin_operation__'):
            func.__plugin_operation__ = op_info
        
        return func

    if callable(name):
        return _process(name, None, description)
        
    def decorator(func):
        return _process(func, name, description)
    
    return decorator


def _map_python_type_to_json(python_type) -> str:
    """将Python类型映射为JSON schema类型"""
    type_mapping = {
        str: "string",
        int: "integer",
        float: "number",
        bool: "boolean",
        list: "array",
        dict: "object",
        Any: "any",
    }
    
    # 处理Optional类型
    if hasattr(python_type, '__origin__') and python_type.__origin__ is Union:
        # 找到非None的类型
        for arg in python_type.__args__:
            if arg is not type(None):
                return _map_python_type_to_json(arg)
    
    # 处理具体类型
    for py_type, json_type in type_mapping.items():
        if python_type is py_type:
            return json_type
    
    # 默认返回object
    return "object"


# def get_plugin_definition(cls) -> Optional[PluginDefinition]:
#     """
#     从装饰的类获取完整的PluginDefinition
#     """
#     if hasattr(cls, '__plugin_wrapper__'):
#         return cls.__plugin_wrapper__.build_definition()
#     if not hasattr(cls, '__plugin_metadata__'):
#         return None
    
#     metadata = cls.__plugin_metadata__
    
#     operations = _collect_operations(cls)
    
#     config_schema = {}
#     if hasattr(cls, '__plugin_config__') and cls.__plugin_config__:
#         config_schema = cls.__plugin_config__.schema
    
#     operations_schema = {
#         name: {
#             "description": info.description,
#             "input_schema": info.input_schema,
#             "output_schema": info.output_schema,
#         }
#         for name, info in operations.items()
#     }
#     return PluginDefinition(
#         id=build_plugin_id(metadata["space"], metadata["name"]),
#         name=metadata["name"],
#         version=metadata["version"],
#         description=metadata["description"],
#         loader_type=metadata["loader_type"],
#         render_type=metadata["render_type"],
#         from_type=metadata["from_type"],
#         scope_type=metadata["scope_type"],
#         config_schema=config_schema,
#         plugin_operation_schema={"operations": operations_schema},
#         tags=metadata["tags"],
#     )
