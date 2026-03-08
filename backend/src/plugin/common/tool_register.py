from functools import wraps
from typing import Callable, List
from sqlalchemy import select

# 插件注解,用于对将任意包装成为可以注册的工具,并通过 get_tool_in_plugin 函数获取对应的工具信息
# 可以对函数注解,也可以对整个类注解,对整个类注解的时候,相当于对这个类的方法注解
# 被注册的工具以键值对的形式保留, key 是工具名称
class PluginToolInfo:
    name: str  # 插件名字, 用切割不同的区域
    tool: Callable  # 可以调用的工具
    description: str  # 描述

TOOL_IN_PLUGIN = {}

def plugin(name: str, description: str) -> Callable:
    """简单装饰器示例, 保留函数元信息。实际插件工具化使用 @tool 装饰器实现。"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

# 从插件中获取工具（仅限 tags 包含 "tool" 且在默认 Agent 配置中启用的 operation）
async def get_tool_in_plugin(plugin_name: List[str]) -> List[Callable]:
    """根据插件名称列表返回可用的工具函数列表。
    只返回 tags 包含 "tool" 且在默认（第一个）Agent 配置中开启的操作。
    """
    from core.plugin.runtime import PluginInternalRegistry
    from services.plugin.service import PluginService
    from infrastructure.pg.pg_client import async_session
    from infrastructure.pg.pg_models import AgentsManagerSQLEntity
    from langchain_core.tools import tool
    from typing import Any

    registry = PluginInternalRegistry.get_global()
    if not registry:
        return []
    # 过滤出需要的插件（必须有 tag "tool"）
    plugins = [p for p in registry.get_plugin_list()
               if p["name"] in plugin_name and "tool" in p.get("tags", [])]
    tools: List[Callable] = []
    async with async_session() as session:
        service = PluginService(session)
        # 获取所有 Agent，取第一个的工具配置作为默认（若无则空）
        stmt = select(AgentsManagerSQLEntity)
        result = await session.execute(stmt)
        agents = result.scalars().all()
        default_tool_cfg: dict = {}
        if agents:
            default_tool_cfg = (agents[0].config or {}).get("tools", {})
        for plug in plugins:
            wrapper = registry.get_plugin_wrapper(plug["id"])
            plugin_cfg = default_tool_cfg.get(plug["name"], {})
            for op_name, op_info in wrapper.operations.items():
                key = f"{op_name}_is_tool"
                enabled = plugin_cfg.get(key, True)
                if not enabled:
                    continue
                # 动态创建 tool
                def make_tool(p_id: Any, operation: str, description: str):
                    @tool(operation)
                    async def _generated_tool(**kwargs: Any):
                        result = await service.invoke_plugin_operation(
                            plugin_id=p_id,
                            operation_name=operation,
                            params=kwargs,
                            registry=registry,
                        )
                        return getattr(result, "payload", result)
                    _generated_tool.__doc__ = description
                    return _generated_tool
                tools.append(make_tool(plug["id"], op_name, op_info.description or ""))
    return tools
