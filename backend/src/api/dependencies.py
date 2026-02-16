"""
FastAPI依赖注入函数
"""
from typing import Annotated

from fastapi import Depends, Request

from core.plugin.manager import PluginManager


def get_plugin_manager(request: Request) -> PluginManager:
    """获取插件管理器依赖"""
    return request.app.state.plugin_manager


# 类型注解别名
PluginManagerDep = Annotated[PluginManager, Depends(get_plugin_manager)]