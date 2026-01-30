from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field


class KDMetaResponse(BaseModel):
    id: UUID
    enabled: bool
    titel: str
    description: str | None = None
    create_at: datetime

class KDDescriptionResponse(BaseModel):
    chunk_id: UUID
    enabled: bool
    search_keys: List[str]
    context: str | None = None
    create_at: datetime | None = None
    update_at: datetime | None = None

class KDCreateRequest(BaseModel):
    name: str
    description: str | None = None

class KDDescriptionCreateRequest(BaseModel):
    chunk_id: UUID
    search_keys: List[str]
    context: str | None = None

class KDUpdateRequest(BaseModel):
    enabled: bool
    name: str
    description: str | None = None

class KDDescriptionUpdateRequest(BaseModel):
    enabled: bool
    search_keys: List[str]
    context: str | None = None
