"""
插件加载器抽象和具体实现
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
import httpx

from api.routes.plugin.schema import StandardDataResponse, RenderType
from common.enums import LoaderType


class PluginLoader(ABC):
    """插件加载器抽象接口"""
    
    @abstractmethod
    async def load(self, config: Dict[str, Any]) -> StandardDataResponse:
        """加载插件数据"""
        pass


class URLLoader(PluginLoader):
    """URL数据源加载器"""
    
    async def load(self, config: Dict[str, Any]) -> StandardDataResponse:
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
                
                # 转换为标准响应格式
                return StandardDataResponse(
                    plugin_id=config.get("plugin_id"),
                    render_type=RenderType.CARD,  # 默认类型，实际应从配置获取
                    payload=data,
                    total=len(data) if isinstance(data, list) else None
                )
                
            except httpx.HTTPError as e:
                raise ValueError(f"HTTP error: {str(e)}")
            except Exception as e:
                raise ValueError(f"Failed to load from URL: {str(e)}")


class JSONLoader(PluginLoader):
    """JSON数据直接加载器"""
    
    async def load(self, config: Dict[str, Any]) -> StandardDataResponse:
        """直接返回配置中的JSON数据"""
        payload = config.get("payload", {})
        
        return StandardDataResponse(
            plugin_id=config.get("plugin_id"),
            render_type=RenderType.CARD,
            payload=payload,
            total=len(payload) if isinstance(payload, list) else None
        )


class InternalLoader(PluginLoader):
    """内部服务加载器"""
    
    async def load(self, config: Dict[str, Any]) -> StandardDataResponse:
        """调用内部服务端点"""
        endpoint = config.get("endpoint")
        if not endpoint:
            raise ValueError("Internal endpoint configuration is required")
        
        # TODO: 实现内部服务调用逻辑
        # 这里可以调用其他FastAPI路由或内部函数
        
        return StandardDataResponse(
            plugin_id=config.get("plugin_id"),
            render_type=RenderType.CARD,
            payload={"message": "Internal loader not implemented yet"},
            total=0
        )


def create_loader(loader_type: LoaderType) -> PluginLoader:
    """根据加载器类型创建对应的加载器实例"""
    if loader_type == LoaderType.URL:
        return URLLoader()
    elif loader_type == LoaderType.JSON:
        return JSONLoader()
    elif loader_type == LoaderType.INTERNAL:
        return InternalLoader()
    else:
        raise ValueError(f"Unknown loader type: {loader_type}")