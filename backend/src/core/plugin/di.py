from typing import Callable, Any, Optional,Dict
from dataclasses import dataclass


@dataclass
class DependencyInfo:
    dependency: Optional[Callable[..., Any]] = None

def Inject(dependency: Optional[Callable[..., Any]] = None) -> Any:
    """
    依赖注入标记。

    参数：
    dependency：一个返回依赖实例的可调用对象。
    它可以接受将从上下文解析的参数。
    当前支持的上下文参数：
    - 'session': 数据库会话 (AsyncSession)
    - 'plugin_id': 当前插件ID (str)
    """
    return DependencyInfo(dependency=dependency)
