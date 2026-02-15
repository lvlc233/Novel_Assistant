"""
插件基础模型定义
定义插件操作的数据结构和构建器
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Any, List, Literal, Sequence, Generic, TypeVar, Type, TypedDict
from abc import ABC, abstractmethod

from common.enums import LoaderType


@dataclass
class ParamDefinition:
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


class BasePluginOperation(TypedDict):
    """
    基础的插件交互的数据结构.
    用于定义插件交互的时候的交互接口和参数.所有插件的操作类型都需要继承该父类
    """
    type: LoaderType
    operations: Sequence[BasePluginOperationItem]


T = TypeVar('T', bound='BaseOperationBuilder')


class BaseOperationBuilder(ABC):
    """操作构建器基类"""
    
    def __init__(self, interface: str):
        self._interface = interface  # 接口名
        self._args_schema: Dict[str, ParamDefinition] = {}  # 参数结构定义
        self._args_values: Dict[str, Any] = {}  # 参数值
    
    def param(self, name: str, value_type: str, description: str = "", 
              required: bool = True, default: Any = None) -> 'BaseOperationBuilder':
        """定义参数结构（基础方法）"""
        self._args_schema[name] = ParamDefinition(
            type=value_type,
            description=description,
            required=required,
            default=default
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


class URLOperationBuilder(BaseOperationBuilder):
    """URL操作构建器（特化版本）"""
    
    def method(self, http_method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]) -> 'URLOperationBuilder':
        """URL特有的方法设置（进行有限约束）"""
        if http_method not in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
            raise ValueError(f"Invalid HTTP method: {http_method}")
        self._args_values['method'] = http_method
        return self
        
    def body(self, data: Dict[str, Any]) -> 'URLOperationBuilder':
        """设置请求体"""
        self._args_values['body'] = data
        return self
        
    def query(self, params: Dict[str, Any]) -> 'URLOperationBuilder':
        """设置查询参数"""
        self._args_values['query'] = params
        return self


class InternalOperationBuilder(BaseOperationBuilder):
    """内部操作构建器"""
    # 内部操作使用基础方法即可
    pass


class BasePluginOperation(Generic[T]):
    """基础插件操作容器"""
    
    def __init__(self, ds_type: LoaderType, builder_class: Type[T]):
        self.type = ds_type
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
            "type": self.type,
            "operations": [b.build_schema() for b in self._builders]
        }
    
    def create_runtime(self) -> Dict[str, Any]:
        """用于实际的插件执行，此时默认值已填充"""
        return {
            "type": self.type,
            "operations": [b.build_runtime() for b in self._builders]
        }


# 具体的插件操作类型
class URLPluginOperation(BasePluginOperation[URLOperationBuilder]):
    """URL插件操作"""
    
    def __init__(self):
        super().__init__(LoaderType.URL, URLOperationBuilder)


class InternalPluginOperation(BasePluginOperation[InternalOperationBuilder]):
    """内部插件操作"""
    
    def __init__(self):
        super().__init__(LoaderType.INTERNAL, InternalOperationBuilder)