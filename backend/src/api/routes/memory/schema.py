from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from common.enums import MemoryTypeEnum


class MemoryMetaResponse(BaseModel):
    id: UUID
    enabled: bool
    name: str
    description: str | None = None
    create_at: datetime

class MemoryDetailResponse(BaseModel):
    id: UUID
    enabled: bool
    name: str
    type: MemoryTypeEnum
    description: str | None = None
    create_at: datetime
    context: str | None = None

class MemoryCreateRequest(BaseModel):
    name: str
    type: MemoryTypeEnum
    description: str | None = None
    context: str | None = None

class MemoryUpdateRequest(BaseModel):
    enabled: bool | None = None
    name: str | None = None
    description: str | None = None
    context: str | None = None
