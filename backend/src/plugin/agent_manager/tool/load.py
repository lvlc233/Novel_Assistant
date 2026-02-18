# # 从插件中加载工具


# from typing import List
# from langchain_core.tools import BaseTool
# from backend.src.core.plugin.base.models import PluginDefinition


# async def load_tools_from_plugin(plugins: List[PluginDefinition]) -> List[BaseTool]:
#     """从插件中加载工具"""
#     # 过滤出工具
#     tool_plugins = [plugin for plugin in plugins if "tool" in plugin.tags]
    
#     return tools