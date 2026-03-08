from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel


class KDMetaResponse(BaseModel):
    id: UUID
    enabled: bool
    title: str
    description: str | None = None
    create_at: datetime

class KDDescriptionResponse(BaseModel):
    chunk_id: UUID
    enabled: bool
    search_keys: List[str]
    content: str | None = None
    create_at: datetime | None = None
    update_at: datetime | None = None

class KDCreateRequest(BaseModel):
    title: str
    work_id: UUID | None = None
    description: str | None = None

class KDDescriptionCreateRequest(BaseModel):
    chunk_id: UUID
    search_keys: List[str] | None = []
    content: str | None = None

class KDUpdateRequest(BaseModel):
    enabled: bool
    title: str
    description: str | None = None

class KDDescriptionUpdateRequest(BaseModel):
    enabled: bool
    search_keys: List[str] | None = None
    content: str | None = None
