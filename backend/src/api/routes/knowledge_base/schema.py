from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class KnowledgeBaseChunkResponse(BaseModel):
    id: str
    kb_id: str
    content: str
    # The SQL model doesn't have title/tags for chunks yet, but frontend expects them.
    # For now, we might need to update the SQL model or map content to title if missing.
    # Let's check pg_models.py again. KnowledgeChunkSQLEntity only has content.
    # We will just return content as title for now or empty string.
    # Wait, frontend expects title. I should probably add title to the SQL model later.
    # For now, I'll stick to what the SQL model has and maybe fake title/tags or add them to SQL model.
    # Given the constraint "do not modify existing files unless necessary", 
    # and I need to fix the 404, I should prioritize getting the API working.
    # But if the frontend expects fields that don't exist, it might break.
    # Let's check KnowledgeChunkSQLEntity again.
    
    # Re-reading pg_models.py:
    # class KnowledgeChunkSQLEntity(SQLModel, table=True):
    #    id: str ...
    #    kb_id: str ...
    #    content: str ...
    
    # It seems very minimal.
    # I will add title to the response schema but it might be empty if DB doesn't have it.
    
    title: str = Field(default="") 
    tags: List[str] = Field(default=[])
    updated_at: datetime | None = None
    created_at: datetime | None = None

class KnowledgeBaseResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    tags: List[str] = Field(default=[])
    created_at: datetime
    updated_at: datetime | None = None

class KnowledgeBaseDetailResponse(KnowledgeBaseResponse):
    chunks: List[KnowledgeBaseChunkResponse] = []

class CreateKnowledgeBaseRequest(BaseModel):
    name: str
    description: str | None = None
    tags: List[str] = Field(default=[])
    work_id: str | None = None

class UpdateKnowledgeBaseRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    tags: List[str] | None = None

class CreateKnowledgeChunkRequest(BaseModel):
    title: str
    content: str
    tags: List[str] = Field(default=[])

class UpdateKnowledgeChunkRequest(BaseModel):
    title: str | None = None
    content: str | None = None
    tags: List[str] | None = None
