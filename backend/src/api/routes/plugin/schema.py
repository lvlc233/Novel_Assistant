from typing import Dict, List
from uuid import UUID

from pydantic import BaseModel, Field

from common.enums import PluginFromType, PluginScopeType


class PluginMetaResponse(BaseModel):
    id: UUID
    name: str
    enabled: bool

class PluginResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    enabled: bool
    config: Dict = Field(default_factory=dict)
    from_type: PluginFromType  # 插件来源类型
    scope_type: PluginScopeType  # 插件作用域类型
    tags: List[str] = Field(default_factory=list)

class PluginUpdateRequest(BaseModel):
    enabled: bool | None = None
    config: Dict | None = None
