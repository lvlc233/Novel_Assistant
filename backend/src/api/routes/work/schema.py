from typing import List, Literal, Optional, Dict
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

# DTOs
class WorkMetaDTO(BaseModel):
    work_id: str
    work_cover_image_url: Optional[str] = None
    work_name: Optional[str] = None
    work_summary: Optional[str] = None
    work_state: Literal["完成", "进行中"] = "进行中" 
    work_type: str
    created_time: datetime
    updated_time: datetime

class NodeDTO(BaseModel):
    node_id: str
    node_name: str
    description: Optional[str] = None
    node_type: Literal["document", "folder"]
    parent_id: Optional[str] = None
    sort_order: int = 0

class EdgeDTO(BaseModel):
    from_nodes: List[str]
    to_nodes: List[str]

# Requests & Responses
class CreateWorkRequest(BaseModel):
    works_cover_image_url: Optional[str] = None
    works_name: Optional[str] = None
    works_summary: Optional[str] = None
    works_type: str = "novel"
    enabled_plugin_id_list: List[UUID] = []

class WorkMetaResponse(BaseModel):
    work_meta: WorkMetaDTO

class WorkMetaUpdateRequest(BaseModel):
    works_cover_image_url: Optional[str] = None
    works_name: Optional[str] = None
    works_summary: Optional[str] = None
    works_state: Literal["完成", "进行中"] = "进行中"

class WorkDetailResponse(BaseModel):
    works_meta: WorkMetaDTO
    works_document: List[NodeDTO] = []
    works_documents_relationship: List[EdgeDTO] = []

class WorkPluginMetaResponse(BaseModel):
    plugin_id: UUID
    name: str
    enabled: bool
    description: Optional[str] = None

class WorkPluginDetailResponse(BaseModel):
    plugin_id: UUID
    name: str
    description: Optional[str] = None
    enabled: bool
    config: Dict
    from_type: Literal["system", "custom"]
    scope_type: Literal["global", "work", "document"]
    tags: List[str]

class UpdateWorkPluginRequest(BaseModel):
    plugin_id: UUID
    enabled: bool
    config: Dict
