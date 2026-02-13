from __future__ import annotations

from datetime import datetime
from typing import List, Union
from uuid import UUID

from pydantic import BaseModel, Field

from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum, RenderType, DataSourceType


# --- Standard Data Protocol ---
class KeyValueItem(BaseModel):
    key: str
    value: str | int | float | bool | None

class PluginConfigItem(BaseModel):
    key: str
    value: str | int | float | bool | None

class PluginConfig(BaseModel):
    items: List[PluginConfigItem] = Field(default_factory=list)

class ConfigField(BaseModel):
    key: str
    label: str | None = None
    value_type: str
    value: str | int | float | bool | None
    children: List["ConfigField"] = Field(default_factory=list)

# 最终的插件配置项
class ConfigPayload(BaseModel):
    fields: List[ConfigField]

class AgentSession(BaseModel):
    session_id: str
    title: str | None = None
    source: str | None = None
    created_at: datetime | None = None
    token_usage: int | None = None

# AgentSession类型的UI数据载体
class AgentMessagesPayload(BaseModel):
    sessions: List[AgentSession]

class CardItem(BaseModel):
    id: str
    title: str
    summary: str | None = None
    tags: List[str] = Field(default_factory=list)
    parent_id: str | None = None

# 卡片类型的UI数据载体
class CardPayload(BaseModel):
    cards: List[CardItem]

class ListItem(BaseModel):
    id: str
    title: str
    subtitle: str | None = None
    content: str | None = None
    tags: List[str] = Field(default_factory=list)
    metadata: List[KeyValueItem] = Field(default_factory=list)

class ListPayload(BaseModel):
    items: List[ListItem]

class DetailItem(BaseModel):
    id: str
    title: str
    content: str | None = None
    fields: List[KeyValueItem] = Field(default_factory=list)

class DetailPayload(BaseModel):
    detail: DetailItem

class DashboardWidget(BaseModel):
    id: str
    title: str
    value: str | int | float | bool | None = None
    unit: str | None = None
    tags: List[str] = Field(default_factory=list)

class DashboardPayload(BaseModel):
    widgets: List[DashboardWidget]

# 具体插件的UI数据载体
RenderPayload = Union[
    ConfigPayload,
    AgentMessagesPayload,
    CardPayload,
    ListPayload,
    DetailPayload,
    DashboardPayload,
]
"""
可配置项
"""
class UrlDataSourceConfig(BaseModel):
    type: DataSourceType = DataSourceType.URL
    url: str

class CheckpointDataSourceConfig(BaseModel):
    type: DataSourceType = DataSourceType.CHECKPOINT
    namespace: str
    thread_id: str | None = None
    limit: int | None = None

class JsonDataSourceConfig(BaseModel):
    type: DataSourceType = DataSourceType.JSON
    payload: RenderPayload

class InternalDataSourceConfig(BaseModel):
    type: DataSourceType = DataSourceType.INTERNAL
    endpoint: str
"""
可配置项载体
"""
DataSourceConfig = Union[
    UrlDataSourceConfig,
    CheckpointDataSourceConfig,
    JsonDataSourceConfig,
    InternalDataSourceConfig,
]

class StandardDataResponse(BaseModel):
    plugin_id: UUID
    render_type: RenderType
    payload: RenderPayload
    total: int | None = None


# --- Plugin Models ---

class PluginMetaResponse(BaseModel):
    id: UUID
    name: str
    enabled: bool
    render_type: RenderType = RenderType.LIST

class PluginResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    enabled: bool
    config: PluginConfig = Field(default_factory=PluginConfig)
    
    data_source_type: DataSourceType | None = None
    data_source_config: DataSourceConfig | None = None
    render_type: RenderType = RenderType.LIST
    auth_config: PluginConfig | None = None
    
    from_type: PluginFromTypeEnum  # 插件来源类型
    scope_type: PluginScopeTypeEnum  # 插件作用域类型
    tags: List[str] = Field(default_factory=list)

class PluginUpdateRequest(BaseModel):
    enabled: bool | None = None
    config: PluginConfig | None = None
    data_source_type: DataSourceType | None = None
    data_source_config: DataSourceConfig | None = None
    auth_config: PluginConfig | None = None
