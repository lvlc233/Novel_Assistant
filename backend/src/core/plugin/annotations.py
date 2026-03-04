"""
三注解系统实现
@plugin, @config, @operation
"""
from __future__ import annotations
from typing import Annotated, Dict, Any, Optional, List, Type, Union, Callable, get_args, get_origin, get_type_hints
from dataclasses import dataclass, field
from inspect import signature, Parameter
import inspect
from urllib.parse import urlencode

from pydantic import Field
from common.enums import LoaderType, PluginFromTypeEnum, UIParamSourceEnum,UITrigger
from core.plugin.base.models import PluginDefinition
from core.plugin.utils import build_plugin_id
from core.ui.base import UIBinding, UINode
from core.plugin.di import DependencyInfo

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
    """
    2026.03.01: 新增属性
    with_ui: 绑定的ui类型,点击该ui组件后触发对应的逻辑
    ui_target: 渲染的目标ui
    target_props: 接口的参数传入方式
    is_stream: 流式输出适配
    trigger: 接口的触发模式
    """
    # UI 绑定属性
    with_ui: List[Union[UIBinding, str]] = field(default_factory=list)
    ui_target: Optional[str] = None
    target_props: List[str] = field(default_factory=list)# 组件的“入参契约”,前端拿到后，会自动做一个过滤（Pick）：只把后端返回中匹配 target_props 的字段传给组件，多余的字段存入缓存，缺少的字段给默认值。
    # 交互属性
    is_stream: bool = False
    trigger: UITrigger = UITrigger.CLICK
    func: Optional[Callable] = None

    def get_full_routes(self) -> List[str]:
        """
        生成最终前端可用的接口路径列表。
        输出示例: ["/home/card/item/get_page?name=item"]
        """
        routes = []

        # 操作后缀，例如 /get_page
        op_suffix = f"/{self.name}"
        
        for binding in self.with_ui:
            if isinstance(binding, UIBinding):
                # 基础路径
                path = "/" + "/".join([p.lower() for p in binding.path_list])
                full_path = f"{path}{op_suffix}"
                
                # 拼接参数
                if binding.predicates:
                    query_string = urlencode(binding.predicates)
                    routes.append(f"{full_path}?{query_string}")
                else:
                    routes.append(full_path)
            elif isinstance(binding, str):
                # 如果是字符串，直接使用
                routes.append(f"{binding}{op_suffix}")
                
        return routes

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
    injections: Dict[str, Any] = field(default_factory=dict) # key是参数名,value是 DependencyInfo(注入函数)

    def build_definition(self) -> PluginDefinition:
        operations_schema = {
            name: {
                "description": info.description,
                "input_schema": info.input_schema,
                "output_schema": info.output_schema,
                "with_ui": [
                    b.generate_base_url() if isinstance(b, UIBinding) else b 
                    for b in info.with_ui
                ],
                "ui_target": info.ui_target,
                "trigger": info.trigger.value if info.trigger else None,
                "is_stream": info.is_stream,
            }
            for name, info in self.operations.items()
        }
        return PluginDefinition(
            id=build_plugin_id(self.metadata["space"], self.metadata["name"]),
            name=self.metadata["name"],
            version=self.metadata["version"],
            description=self.metadata["description"],
            loader_type=self.metadata["loader_type"],
            from_type=self.metadata["from_type"],
            config_schema=self.config_schema,
            plugin_operation_schema={"operations": operations_schema},
            tags=self.metadata["tags"],
            # data_source_entry_point=self.metadata["data_source_entry_point"]
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
    version: str = "1.0.0",                                     # 插件版本  
    description: Optional[str] = None,                          # 插件描述
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
        from_type: 来源类型
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
            "from_type": from_type,
            "tags": tags,
            # "data_source_entry_point": data_source_entry_point
        }
        config_schema = {}
        # 收集配置信息->基于runtime_config装饰器,从__init__方法参数中收集
        if hasattr(cls.__init__, '__plugin_config_schema__'):
            config_schema = cls.__init__.__plugin_config_schema__
        
        cls.__plugin_config__ = ConfigInfo(
            schema=config_schema,
            init_func=cls.__init__
        )
        
        # 收集依赖注入信息
        injections = getattr(cls.__init__, "__plugin_injections__", {})
        
        operations = _collect_operations(cls)
        cls.__plugin_operations__ = operations
        cls.__plugin_wrapper__ = PluginWrapper(
            plugin_cls=cls,
            metadata=cls.__plugin_metadata__,
            config_schema=config_schema,
            operations=operations,
            injections=injections,
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
    injections = {}
    
    for param_name, param in sig.parameters.items():
        if param_name == 'self':
            continue
        
        # 识别依赖注入
        if isinstance(param.default, DependencyInfo):
            injections[param_name] = param.default
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
    init_func.__plugin_injections__ = injections
    
    return init_func


def operation(
    name: Union[str, Callable, None] = None, 
    description: Optional[str] = None,
    with_ui: List[UIBinding] = None,
    ui_target: Union[Type[UINode], UIBinding, None] = None,
    trigger: UITrigger = UITrigger.CLICK
):
    """
    操作接口装饰器
    整合了：1. 路径自动生成 2. 参数来源鉴定 3. 流式检测 4. UI 契约提取
    """
    def _process(func, op_name, op_desc):
        # 基础元数据提取
        real_name = op_name or func.__name__
        real_desc = op_desc or func.__doc__
        
        # 1. 参数来源鉴定 (区分 Context / Props / Input)
        type_hints = get_type_hints(func, include_extras=True)
        sig = inspect.signature(func)
        input_schema = {}
        
        for param_name, param in sig.parameters.items():
            if param_name == 'self': continue
            
            hint = type_hints.get(param_name, Any)
            # 默认来源为用户输入
            source = UIParamSourceEnum.INPUT 
            context_key = param_name
            
            # 解析 Annotated[type, Source, key]
            if get_origin(hint) is Annotated:
                base_type = get_args(hint)[0]
                metadata = get_args(hint)[1:]
                for meta in metadata:
                    if isinstance(meta, UIParamSourceEnum):
                        source = meta
                    elif isinstance(meta, str):
                        context_key = meta
            else:
                base_type = hint

            input_schema[param_name] = {
                "type": _map_python_type_to_json(base_type),
                "required": param.default is inspect.Parameter.empty,
                "source": source.value,
                "context_key": context_key
            }

        # 2. 自动检测流式输出 (AsyncGenerator)
        is_stream = inspect.isasyncgenfunction(func)

        # 3. 创建增强的操作信息 (包含路径生成能力)
        # 处理 ui_target 的兼容性
        target_path = None
        target_props = []
        
        if ui_target:
            if isinstance(ui_target, UIBinding):
                # 如果是 UIBinding 实例（例如 .filter() 的结果）
                target_path = ui_target.generate_base_url()
                # UIBinding 不一定能拿到 prop_schema，因为它是实例，但我们可以尝试
                # 这里可能需要根据 path_list 反推类，或者暂且置空
                # 如果需要属性契约，可能得要求传入类本身，或者 UIBinding 携带类引用
                target_props = [] 
            elif hasattr(ui_target, 'get_path'):
                # 如果是 UINode 类
                parts = ui_target._get_hierarchy()
                target_path = "/" + "/".join([p.lower() for p in parts])
                target_props = ui_target.get_prop_schema()
                
        op_info = OperationInfo(
            name=real_name,
            description=real_desc,
            input_schema=input_schema,
            # 这里的 output_schema 可以根据需要解析 return hint
            output_schema={"type": _map_python_type_to_json(type_hints.get('return', Any))},
            func=func,
            with_ui=with_ui or [],
            ui_target=target_path,
            # 自动提取目标组件的“入参契约”
            target_props=target_props,
            is_stream=is_stream,
            trigger=trigger
        )
        
        # 将元数据绑定到函数对象，供 PluginWrapper 收集
        func.__plugin_operation__ = op_info
        return func

    # --- Decorator 兼容性处理逻辑 ---
    if callable(name):
        # 处理 @operation 无括号调用的情况
        return _process(name, None, description)
        
    def decorator(func):
        # 处理 @operation(name="...") 有参数调用的情况
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


