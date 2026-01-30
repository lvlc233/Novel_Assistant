from typing import List
from uuid import UUID

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
    full_text: str | None = None # content

class DocumentDetailResponse(BaseModel):
    title: str
    description: str | None = None
    from_node_id: UUID | None = None
    full_text: str | None = None
    
# --- Node (Folder) Schemas ---

class NodeCreateRequest(BaseModel):
    name: str
    description: str | None = None
    type: NodeTypeEnum.FOLDER = NodeTypeEnum.FOLDER
    from_node_id: UUID | None = None

class NodeResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    type: NodeTypeEnum.FOLDER
    from_node_id: UUID | None = None

class NodeUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    type: NodeTypeEnum.FOLDER = NodeTypeEnum.FOLDER
    from_node_id: UUID | None = None

class RelationshipResponse(BaseModel):
    document: List[NodeDTO] = []
    relationship: List[EdgeDTO] = []

# --- Internal DTOs for Service ---

class CreateNodeDTO(BaseModel):
    name: str
    description: str | None = None
    type: NodeTypeEnum.FOLDER = NodeTypeEnum.FOLDER
    parent_node_id: UUID | None = None

class UpdateNodeDTO(BaseModel):
    name: str | None = None
    description: str | None = None
    parent_node_id: UUID | None = None
    content: str | None = None

class NodeDetailResponse(BaseModel):
    # Service returns this
    id: str
    name: str
    content: str
    type: NodeTypeEnum.FOLDER   
    word_count: int
    description: str | None = None
    parent_node_id: UUID | None = None
