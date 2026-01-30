from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from pydantic import BaseModel, Field

from common.enums import MessagesTypeEnum




# --- Spec Models ---

class AgentMetaResponse(BaseModel):
    id: UUID
    enabled: bool
    name: str
    broadcast: bool
    description: str | None = None
    create_at: datetime

class AgentDetailResponse(BaseModel):
    id: UUID
    enabled: bool
    name: str
    broadcast: bool
    context_size: int = Field(..., description="上下文大小,-1不限制,0无历史")
    is_summary: bool
    description: str | None = None
    create_at: datetime
    sessions: List[str]

class AgentMessagesResponse(BaseModel):
    session_id: UUID
    messages: List[Dict]

class MessagesSendRequest(BaseModel):
    context: str # 上下文

class AgentUpdateRequest(BaseModel):
    broadcast: bool




