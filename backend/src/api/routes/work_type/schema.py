from typing import List
from uuid import UUID

from pydantic import BaseModel

from common.enums import WorkTypeEnum,NodeTypeEnum


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
