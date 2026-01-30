from datetime import datetime
from typing import Dict, List
from uuid import UUID

from pydantic import BaseModel

from common.enums import NodeType, NovelStateCN, PluginFromType, PluginScopeType


# DTOs
class WorkMetaDTO(BaseModel):
    work_id: str
    work_cover_image_url: str | None = None
    work_name: str | None = None
    work_summary: str | None = None
    work_state: NovelStateCN = NovelStateCN.UPDATING 
    work_type: str
    created_time: datetime
    updated_time: datetime

class NodeDTO(BaseModel):
    node_id: str
    node_name: str
    description: str | None = None
    node_type: NodeType
    parent_id: str | None = None
    sort_order: int = 0

class EdgeDTO(BaseModel):
    from_nodes: List[str]
    to_nodes: List[str]

# Requests & Responses
class CreateWorkRequest(BaseModel):
    works_cover_image_url: str | None = None
    works_name: str | None = None
    works_summary: str | None = None
    works_type: str = "novel"
    enabled_plugin_id_list: List[UUID] = []

class WorkMetaResponse(BaseModel):
    work_meta: WorkMetaDTO

class WorkMetaUpdateRequest(BaseModel):
    works_cover_image_url: str | None = None
    works_name: str | None = None
    works_summary: str | None = None
    works_state: NovelStateCN = NovelStateCN.UPDATING

class WorkDetailResponse(BaseModel):
    works_meta: WorkMetaDTO
    works_document: List[NodeDTO] = []
    works_documents_relationship: List[EdgeDTO] = []

class WorkPluginMetaResponse(BaseModel):
    plugin_id: UUID
    name: str
    enabled: bool
    description: str | None = None

class WorkPluginDetailResponse(BaseModel):
    plugin_id: UUID
    name: str
    description: str | None = None
    enabled: bool
    config: Dict
    from_type: PluginFromType
    scope_type: PluginScopeType
    tags: List[str]

class UpdateWorkPluginRequest(BaseModel):
    plugin_id: UUID
    enabled: bool
    config: Dict
