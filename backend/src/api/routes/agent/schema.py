from typing import Any, Dict

from pydantic import BaseModel, Field


class CreateAgentRequest(BaseModel):
    name: str
    description: str | None = None
    agent_type: str
    config: Dict = {}
    broadcast: bool = False

class UpdateAgentRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    config: Dict | None = None
    enabled: bool | None = None
    broadcast: bool | None = None

class AgentResponse(BaseModel):
    id: str
    name: str
    description: str | None
    agent_type: str
    enabled: bool
    broadcast: bool
    config: Dict

class InvokeAgentRequest(BaseModel):
    input: Dict[str, Any]
    thread_id: str = Field(..., description="Thread ID for conversation memory")

class InvokeAgentResponse(BaseModel):
    output: Dict[str, Any]

