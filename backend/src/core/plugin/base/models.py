"""
插件基础模型定义
定义插件操作的数据结构和构建器
"""
from __future__ import annotations

from os import name
from typing import Callable, Dict, Any, List, Generic, TypeVar, Type, Optional
from typing_extensions import TypedDict
from abc import ABC
from uuid import UUID
from pydantic import BaseModel
from common.enums import LoaderType, PluginFromTypeEnum
from core.plugin.utils import build_plugin_id

"""
插件操作相关:
"""
class ParamDefinition(TypedDict):
    """参数定义"""
    type: str  # 类型描述字符串，如 "str", "int", "UUID|None"
    description: str  # 参数描述
    required: bool = True  # 是否必需
    default: Any = None  # 默认值（可选）


class BasePluginOperationItem(TypedDict):
    """
    基础的插件交互的数据结构.
    用于定义插件交互的时候的交互接口和参数
    """
    interface: str
    args: Dict[str, Any]
    # callable: Callable[..., Any] = None  # 可调用对象（插件方法）


T = TypeVar('T', bound='BaseOperationBuilder')

# 操作构建器
class BaseOperationBuilder(ABC):
    """操作构建器基类"""
    
    def __init__(self, interface: str):
        self._interface = interface  # 接口名
        self._args_schema: Dict[str, ParamDefinition] = {}  # 参数结构定义
        self._args_values: Dict[str, Any] = {}  # 参数值
    
    def param(self, name: str, value_type: str, description: str = "", 
              required: bool = True, default: Any = None, tags:List[str] = None) -> 'BaseOperationBuilder':
        """定义参数结构（基础方法）"""
        self._args_schema[name] = ParamDefinition(
            type=value_type,
            description=description,
            required=required,
            default=default,
            tags=tags
        )
        return self
        
    def value(self, name: str, value: Any) -> 'BaseOperationBuilder':
        """设置参数值（基础方法）"""
        self._args_values[name] = value
        return self
    
    def build_schema(self) -> Dict[str, Any]:
        """构建参数结构定义"""
        return {
            "interface": self._interface,
            "params": {k: v.__dict__ for k, v in self._args_schema.items()}
        }
        
    def build_runtime(self) -> Dict[str, Any]:
        """构建运行时参数（包含默认值填充）"""
        final_args = {}
        for name, spec in self._args_schema.items():
            # 核心填充逻辑：优先取 value，取不到则取 schema 里的 default
            val = self._args_values.get(name, spec.default)
            
            # 必填校验
            if spec.required and val is None:
                raise ValueError(f"Missing required parameter: '{name}' for interface '{self._interface}'")
            
            if val is not None:
                final_args[name] = val
        
        return {
            "interface": self._interface,
            "args": final_args
        }

# 插件操作容器
class BasePluginOperation(Generic[T]):
    """基础插件操作容器"""
    
    def __init__(self, builder_class: Type[T]):
        self._builder_class = builder_class
        self._builders: List[T] = []
    
    def add_operation(self, interface: str) -> T:
        """开启一个新操作的构建"""
        builder = self._builder_class(interface)
        self._builders.append(builder)
        return builder
    
    def create_schema(self) -> Dict[str, Any]:
        """用于生成接口文档、UI 界面或 AI 提示词"""
        return {
            "operations": [b.build_schema() for b in self._builders]
        }
    
    def create_runtime(self) -> Dict[str, Any]:
        """用于实际的插件执行，此时默认值已填充"""
        return {
            "operations": [b.build_runtime() for b in self._builders]
        }

"""
插件定义
2026.03.01: 适配SDUI的思路移除了render_type,scope,数据源入口的概念
"""
class PluginDefinition(TypedDict):
    """插件定义模型"""
    
    id: UUID                                        # 插件ID
    name: str                                       # 插件名称
    version: str = "1.0.0"                         # 插件版本
    description: Optional[str] = None              # 插件描述
    from_type: PluginFromTypeEnum = PluginFromTypeEnum.CUSTOM # 插件来源类型
    loader_type: LoaderType                       # 插件加载器类型
    config_schema: Dict[str, Any] = {}           # 插件配置参数结构定义
    plugin_operation_schema: Dict[str, Any] = {}  # 插件操作接口定义
    tags: List[str] = []                          # 插件标签
    


