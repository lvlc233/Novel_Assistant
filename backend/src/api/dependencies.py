from fastapi import Request

from core.plugin.runtime import PluginInternalRegistry


def get_internal_plugin_registry(request: Request) -> PluginInternalRegistry:
    return request.app.state.internal_plugin_registry
