from typing import List, Literal
from uuid import UUID

from pydantic import BaseModel

from api.routes.work.schema import EdgeDTO, NodeDTO

# --- Document Schemas ---

class DocumentCreateRequest(BaseModel):
    title: str
    description: str | None = None
    fater_node_id: UUID | None = None

class DocumentResponse(BaseModel):
    document_id: UUID
    title: str
    description: str | None = None
    fater_node_id: UUID | None = None

class DocumentUploadRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    fater_node_id: UUID | None = None
    full_text: str | None = None # content

class DocumentDetailResponse(BaseModel):
    title: str
    description: str | None = None
    fater_node_id: UUID | None = None
    full_text: str | None = None
    
# --- Node (Folder) Schemas ---

class NodeCreateRequest(BaseModel):
    node_name: str
    description: str | None = None
    node_type: Literal["folder"] = "folder"
    fater_node_id: UUID | None = None

class NodeResponse(BaseModel):
    node_id: str
    node_name: str
    description: str | None = None
    node_type: Literal["folder"]
    fater_node_id: UUID | None = None

class NodeUpdateRequest(BaseModel):
    node_name: str | None = None
    description: str | None = None
    node_type: Literal["folder"] = "folder"
    fater_node_id: UUID | None = None

class RelationshipResponse(BaseModel):
    works_document: List[NodeDTO] = []
    works_documents_relationship: List[EdgeDTO] = []

# --- Internal DTOs for Service ---

class CreateNodeDTO(BaseModel):
    node_name: str
    description: str | None = None
    node_type: Literal["document", "folder"]
    fater_node_id: UUID | None = None

class UpdateNodeDTO(BaseModel):
    node_name: str | None = None
    description: str | None = None
    fater_node_id: UUID | None = None
    content: str | None = None

class NodeDetailResponse(BaseModel):
    # Service returns this
    node_id: str
    node_name: str
    content: str
    node_type: str # Relaxed from Literal["document", "folder"] to allow other types like "whiteboard"
    word_count: int
    description: str | None = None
    fater_node_id: UUID | None = None
