from __future__ import annotations

from typing import Any, List, Dict
from uuid import UUID

from pydantic import BaseModel, Field

from common.enums import PluginFromTypeEnum, LoaderType

# --- Plugin Models ---

class PluginMetaResponse(BaseModel):
    id: UUID
    name: str
    version: str
    description: str | None = None
    enabled: bool

class PluginShopMetaResponse(BaseModel):
    id: UUID
    name: str
    # 当前版本
    version: str
    # 最新版本
    latest_version: str 
    description: str | None = None
    # 插件来源:分为系统的和非系统的,系统的总是启动且不可卸载
    from_type: PluginFromTypeEnum
    # 是否已安装
    installed:bool

class PluginResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    enabled: bool
    data_source_type: LoaderType | None = None
    auth_config: Dict[str, Any] | None = None
    from_type: PluginFromTypeEnum  # 插件来源类型
    tags: List[str] = Field(default_factory=list)

class PluginUpdateRequest(BaseModel):
    enabled: bool | None = None
    config: Dict[str, Any] | None = None
    data_source_type: LoaderType | None = None
    data_source_config: Dict[str, Any] | None = None
    auth_config: Dict[str, Any] | None = None

class PluginOperationInvokeRequest(BaseModel):
    params: Dict[str, Any] = Field(default_factory=dict)
    runtime_config: Dict[str, Any] | None = None

class PluginOperationInvokeResponse(BaseModel):
    plugin_id: UUID
    operation: str

class InternalPluginResponse(BaseModel):
    id: UUID
    name: str
    version: str
    description: str | None = None
    from_type: PluginFromTypeEnum
    loader_type: LoaderType
    tags: List[str] = Field(default_factory=list)
    config_schema: dict[str, Any] = Field(default_factory=dict)
    plugin_operation_schema: dict[str, Any] = Field(default_factory=dict)
