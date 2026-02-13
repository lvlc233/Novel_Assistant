from typing import Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.agent.project_helper.schema import (
    ProjectHelperChatConfigRequest,
    ProjectHelperChatConfigResponse,
    ProjectHelperResourcesRequest,
    ProjectHelperResourcesResponse,
)
from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum, RenderType
from common.utils import get_now_time
from infrastructure.pg.pg_models import PluginSQLEntity


PROJECT_HELPER_PLUGIN_NAME = "project_helper"

# 变更记录:
# 注释者: BackendAgent(python)
# 时间: 2026-02-13 01:50:00
# 使用位置: ProjectHelperService 配置与资源持久化服务
# 实现概述: 基于 PluginSQLEntity.default_config 存取配置与资源


class ProjectHelperService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_or_create_plugin(self) -> PluginSQLEntity:
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.name == PROJECT_HELPER_PLUGIN_NAME)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        if plugin:
            return plugin

        default_config: Dict[str, object] = {
            "model_name": "",
            "base_url": "",
            "api_key": "",
            "user_prompt": "",
            "resources": {}
        }

        plugin = PluginSQLEntity(
            name=PROJECT_HELPER_PLUGIN_NAME,
            description="项目助手",
            from_type=PluginFromTypeEnum.SYSTEM,
            scope_type=PluginScopeTypeEnum.GLOBAL,
            enabled=True,
            config_schema={},
            default_config=default_config,
            data_source_type=None,
            data_source_config={},
            render_type=RenderType.CONFIG,
            auth_config={},
            tags=["agent", "project"]
        )
        self.session.add(plugin)
        await self.session.commit()
        await self.session.refresh(plugin)
        return plugin

    @staticmethod
    def _ensure_str(value: object) -> str:
        if isinstance(value, str):
            return value
        if value is None:
            return ""
        return str(value)

    @staticmethod
    def _extract_resources(config: Dict[str, object]) -> Dict[str, bool]:
        resources = config.get("resources")
        if isinstance(resources, dict):
            return {str(k): bool(v) for k, v in resources.items()}
        return {}

    async def get_config(self) -> ProjectHelperChatConfigResponse:
        plugin = await self._get_or_create_plugin()
        config = plugin.default_config or {}
        return ProjectHelperChatConfigResponse(
            model_name=self._ensure_str(config.get("model_name")),
            base_url=self._ensure_str(config.get("base_url")),
            api_key=self._ensure_str(config.get("api_key")),
            user_prompt=self._ensure_str(config.get("user_prompt"))
        )

    async def update_config(self, request: ProjectHelperChatConfigRequest) -> None:
        plugin = await self._get_or_create_plugin()
        config = dict(plugin.default_config or {})
        config["model_name"] = request.model_name
        config["base_url"] = request.base_url
        config["api_key"] = request.api_key
        config["user_prompt"] = request.user_prompt
        plugin.default_config = config
        plugin.update_at = get_now_time()
        await self.session.commit()

    async def get_resources(self) -> List[ProjectHelperResourcesResponse]:
        plugin = await self._get_or_create_plugin()
        config = plugin.default_config or {}
        resources = self._extract_resources(config)
        enabled_list = [k for k, v in resources.items() if v]
        disabled_list = [k for k, v in resources.items() if not v]
        response_data: List[ProjectHelperResourcesResponse] = []
        if enabled_list:
            response_data.append(ProjectHelperResourcesResponse(resource_name=enabled_list, enabled=True))
        if disabled_list:
            response_data.append(ProjectHelperResourcesResponse(resource_name=disabled_list, enabled=False))
        return response_data

    async def update_resources(self, request: ProjectHelperResourcesRequest) -> None:
        plugin = await self._get_or_create_plugin()
        config = dict(plugin.default_config or {})
        resources = self._extract_resources(config)
        for name in request.resource_name:
            resources[name] = request.enabled
        config["resources"] = resources
        plugin.default_config = config
        plugin.update_at = get_now_time()
        await self.session.commit()
