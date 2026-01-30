from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MemoryMetaResponse(BaseModel):
    memory_id: UUID
    enable: bool
    memory_name: str
    memory_description: str | None = None
    create_at: datetime

class MemoryDetailResponse(BaseModel):
    memory_id: UUID
    enable: bool
    memory_name: str
    memory_type: str
    memory_description: str | None = None
    create_at: datetime
    memory_content: str | None = None

class MemoryCreateRequest(BaseModel):
    memory_name: str
    memory_type: str
    memory_description: str | None = None
    memory_context: str | None = None

class MemoryUpdateRequest(BaseModel):
    enable: bool | None = None
    memory_name: str | None = None
    memory_description: str | None = None
    memory_context: str | None = None
