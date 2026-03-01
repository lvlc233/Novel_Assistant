
from typing import Any, Dict, Literal

import httpx
from common.enums import LoaderType
from core.plugin.base.models import BaseOperationBuilder, BasePluginOperation, PluginLoader



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

# 具体的插件操作类型
class URLPluginOperation(BasePluginOperation[URLOperationBuilder]):
    """URL插件操作"""
    
    def __init__(self):
        super().__init__(LoaderType.URL, URLOperationBuilder)


