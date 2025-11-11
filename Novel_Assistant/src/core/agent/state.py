

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class KDBuildState:
    
    documents:Dict[str,str]=field(default_factory=dict,metadata={"description":"文档,key为id"})


