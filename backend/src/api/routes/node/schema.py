from typing import List
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel

from api.routes.work.schema import EdgeDTO, NodeDTO
from common.enums import NodeTypeEnum

# --- Document Schemas ---

class DocumentCreateRequest(BaseModel):
    title: str
    description: str | None = None
    from_node_id: UUID | None = None

class DocumentResponse(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    from_node_id: UUID | None = None

class DocumentUploadRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    from_node_id: UUID | None = None
    
class DocumentVersionUploadRequest(BaseModel):
    full_text: str

class DocumentDetailResponse(BaseModel):
    id: UUID
    work_id:UUID
    title: str
    description: str | None = None
    from_node_id: UUID | None = None
    full_text: str | None = None
    now_version_id: UUID
    now_version: str | None = None # 当前版本名称

class DocumentVersionCreateRequest(BaseModel):
    version_name: str | None = None

class DocumentVersionItem(BaseModel):
    id: UUID
    version: str
    create_at: datetime

class DocumentVersionResponse(BaseModel):
    versions: List[DocumentVersionItem]
    
# --- Node (Folder) Schemas ---

class NodeCreateRequest(BaseModel):
    name: str
    description: str | None = None
    type: NodeTypeEnum = NodeTypeEnum.FOLDER
    from_node_id: UUID | None = None

class NodeResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    type: NodeTypeEnum
    from_node_id: UUID | None = None

class NodeUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    type: NodeTypeEnum = NodeTypeEnum.FOLDER
    from_node_id: UUID | None = None

class RelationshipResponse(BaseModel):
    document: List[NodeDTO] = []
    relationship: List[EdgeDTO] = []

# --- Internal DTOs for Service ---

class CreateNodeDTO(BaseModel):
    name: str
    description: str | None = None
    type: NodeTypeEnum = NodeTypeEnum.FOLDER
    parent_node_id: UUID | None = None

class UpdateNodeDTO(BaseModel):
    name: str | None = None
    description: str | None = None
    parent_node_id: UUID | None = None
    content: str | None = None

class NodeDetailResponse(BaseModel):
    # Service returns this
    id: UUID
    work_id: UUID | None = None
    name: str
    content: str
    type: NodeTypeEnum
    word_count: int
    description: str | None = None
    parent_node_id: UUID | None = None
    now_version: str | None = None
    now_version_id: UUID | None = None # 添加 version_id
    now_version: str | None = None
