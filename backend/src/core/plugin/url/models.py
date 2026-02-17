
from typing import Any, Dict, Literal

import httpx
from backend.src.common.enums import LoaderType
from backend.src.core.plugin.base.models import BaseOperationBuilder, BasePluginOperation, PluginLoader



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


# TODO?
class URLLoader(PluginLoader):
    """URL数据源加载器"""
    
    async def load(self, config: Dict[str, Any]) :
        """从URL加载数据"""
        url = config.get("url")
        if not url:
            raise ValueError("URL configuration is required")
        
        headers = config.get("headers", {})
        timeout = config.get("timeout", 30.0)
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers=headers,
                    timeout=timeout
                )
                response.raise_for_status()
                
                data = response.json()
                
                
            except httpx.HTTPError as e:
                raise ValueError(f"HTTP error: {str(e)}")
            except Exception as e:
                raise ValueError(f"Failed to load from URL: {str(e)}")
