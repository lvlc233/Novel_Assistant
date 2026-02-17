from typing import List
from uuid import UUID

from pydantic import BaseModel

from common.enums import NodeTypeEnum, WorkTypeEnum


class WorkTypeResponse(BaseModel):
    id: UUID
    enabled: bool
    type: WorkTypeEnum

class WorkTypeDetailResponse(BaseModel):
    id: UUID
    enabled: bool
    tags: List[NodeTypeEnum]
    relationship: List[str]
    configurable: bool
