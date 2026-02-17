"""
演示插件 - 使用三注解系统
"""
from typing import Dict, Any, Optional

from core.plugin.decorators import plugin, config, operation
from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum, LoaderType, RenderType


@config
@plugin(
    name="demoPlugin",
    space="demoPlugin", 
    version="1.0.0",
    description="这是一个演示插件",
    loader_type=LoaderType.INTERNAL,
    render_type=RenderType.CARD,
    from_type=PluginFromTypeEnum.OFFICIAL,
    scope_type=PluginScopeTypeEnum.GLOBAL,
    tags=["demo"]
)
class DemoPlugin:
    """
    演示插件类
    这是一个示例插件，展示了三注解系统的使用方法
    """

    def __init__(self, 
                 database_url: str, 
                 max_connections: int = 10, 
                 timeout: float = 30.0,
                 enabled: bool = True):
        """
        插件初始化方法
        
        Args:
            database_url: 数据库连接URL
            max_connections: 最大连接数
            timeout: 超时时间(秒)
            enabled: 是否启用插件
        """
        self.config = {
            'database_url': database_url,
            'max_connections': max_connections,
            'timeout': timeout,
            'enabled': enabled
        }
        self.runtime_data: Dict[str, Any] = {}

    def __init__(self, 
                 database_url: str, 
                 max_connections: int = 10, 
                 timeout: float = 30.0,
                 enabled: bool = True):
        """
        插件初始化方法
        
        Args:
            database_url: 数据库连接URL
            max_connections: 最大连接数
            timeout: 超时时间(秒)
            enabled: 是否启用插件
        """
        self.config = {
            'database_url': database_url,
            'max_connections': max_connections,
            'timeout': timeout,
            'enabled': enabled
        }
        self.runtime_data: Dict[str, Any] = {}

    @operation(name="run")
    def run(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        执行查询操作
        
        Args:
            query: 查询语句
            limit: 结果限制数量
            
        Returns:
            查询结果
        """
        return {
            "status": "success",
            "query": query,
            "limit": limit,
            "results": [
                {"id": 1, "name": "结果1"},
                {"id": 2, "name": "结果2"}
            ]
        }

    @operation(name="get_status")
    def get_status(self) -> Dict[str, Any]:
        """
        获取插件状态
        
        Returns:
            插件状态信息
        """
        return {
            "status": "running",
            "config": self.config,
            "runtime_data": self.runtime_data
        }

    @operation(name="update_config")
    def update_config(self, 
                     database_url: Optional[str] = None,
                     max_connections: Optional[int] = None,
                     timeout: Optional[float] = None,
                     enabled: Optional[bool] = None) -> Dict[str, Any]:
        """
        更新插件配置
        
        Args:
            database_url: 新的数据库URL
            max_connections: 新的最大连接数
            timeout: 新的超时时间
            enabled: 是否启用
            
        Returns:
            更新结果
        """
        if database_url is not None:
            self.config['database_url'] = database_url
        if max_connections is not None:
            self.config['max_connections'] = max_connections
        if timeout is not None:
            self.config['timeout'] = timeout
        if enabled is not None:
            self.config['enabled'] = enabled
            
        return {"status": "updated", "new_config": self.config}