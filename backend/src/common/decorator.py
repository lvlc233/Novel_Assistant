"""
自定义装饰器

1. 节点装饰器
"""
from dataclasses import dataclass
from typing import Callable, Dict

@dataclass(slots=True)
class NodeMeta:
    func: Callable
    node_name: str
 

# 全局仓库：key = node_name
_REGISTRY: Dict[str, NodeMeta] = {}

def node(
    *,
    node_name: str,
) -> Callable[[Callable], Callable]:
    """自描述装饰器"""
    def _decorator(func: Callable) -> Callable:
        _REGISTRY[node_name] = NodeMeta(
            func=func,
            node_name=node_name,
        )
        return func
    return _decorator

__all__ = [
    "node",
]
