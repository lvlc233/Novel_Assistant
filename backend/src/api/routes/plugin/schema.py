from typing import List, Literal, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, Field

class PluginMetaResponse(BaseModel):
    id: UUID
    name: str
    enabled: bool
    # description: Optional[str] = None # TODO:严格按照统一标准文档来。这里不需要
    # from_type: Literal["system", "custom"] TODO:严格按照统一标准文档来。这里不需要
    # scope_type: Literal["global", "work", "document"] TODO:严格按照统一标准文档来。这里不需要

class PluginResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    enabled: bool
    config: Dict = Field(default_factory=dict)
    from_type: Literal["system", "custom"]  # 插件来源类型
    scope_type: Literal["global", "work", "document"]  # 插件作用域类型
    tags: List[str] = Field(default_factory=list)

class PluginUpdateRequest(BaseModel):
    enabled: Optional[bool] = None
    config: Optional[Dict] = None
