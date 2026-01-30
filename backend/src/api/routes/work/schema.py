from datetime import datetime
from typing import Dict, List
from uuid import UUID

from pydantic import BaseModel

from common.enums import NodeTypeEnum, WorkStateCNEnum, PluginFromTypeEnum, PluginScopeTypeEnum,WorkTypeEnum


# DTOs
class WorkMetaDTO(BaseModel):
    id: UUID
    cover_image_url: str | None = None
    name: str | None = None
    summary: str | None = None
    state: WorkStateCNEnum = WorkStateCNEnum.UPDATING 
    type: WorkTypeEnum
    create_at: datetime
    update_at: datetime

class NodeDTO(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    type: NodeTypeEnum

class EdgeDTO(BaseModel):
    from_node_id: UUID
    to_node_ids: List[UUID]

# Requests & Responses
class CreateWorkRequest(BaseModel):
    cover_image_url: str | None = None
    name: str | None = None
    summary: str | None = None
    type: WorkTypeEnum = WorkTypeEnum.NOVEL # WorkTypeEnum in spec, essentially string or enum
    enabled_plugin_id_list: List[UUID] = []

class WorkMetaResponse(BaseModel):
    meta: WorkMetaDTO

class WorkMetaUpdateRequest(BaseModel):
    cover_image_url: str | None = None
    name: str | None = None
    summary: str | None = None
    state: WorkStateCNEnum = WorkStateCNEnum.UPDATING

class WorkDetailResponse(BaseModel):
    meta: WorkMetaDTO
    document: List[NodeDTO] = []
    relationship: List[EdgeDTO] = []

class WorkPluginMetaResponse(BaseModel):
    id: UUID
    name: str
    enabled: bool
    description: str | None = None

class WorkPluginDetailResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    enabled: bool
    config: Dict
    from_type: PluginFromTypeEnum
    scope_type: PluginScopeTypeEnum
    tags: List[str]

class UpdateWorkPluginRequest(BaseModel):
    enabled: bool
    config: Dict | None = None
