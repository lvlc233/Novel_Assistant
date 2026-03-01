"""
基础的UI映射,分别有Page(页面),Slot(插槽),Component(组件),来共同的组成所有的UI元素
"""

from __future__ import annotations
from dataclasses import dataclass, field
import inspect
from urllib.parse import urlencode
from typing import List, Dict,Any

class UINode:
    """UI 拓扑节点基类.
    用于表达UI的拓扑结构,每个节点都有一个唯一的路径,可以通过路径来访问到该节点.
    目的是为了构建插件的操作映射到UI界面的作用范围和时机
    """

    @classmethod
    def _get_hierarchy(cls) -> List[str]:
        """获取类嵌套层级"""
        return cls.__qualname__.split('.')

    @classmethod
    def filter(cls, **conditions) -> UIBinding:
        """生成绑定对象"""
        return UIBinding(
            path_list=cls._get_hierarchy(),
            predicates=conditions
        )

    @classmethod
    def get_path(cls) -> str:
        return ".".join(cls._get_hierarchy())

    @classmethod
    def get_prop_schema(cls) -> List[str]:
        if cls.__init__ is object.__init__:
            return []
        sig = inspect.signature(cls.__init__)
        return [n for n in sig.parameters.keys() if n != 'self']

@dataclass
class UIBinding:
    """封装绑定路径和过滤条件"""
    path_list: List[str]  # ['Home', 'Page', 'Index']
    predicates: Dict[str, Any] = field(default_factory=dict)

    def generate_base_url(self) -> str:
        """生成基础路径部分: /home/page/index?name=asd"""
        path = "/" + "/".join([p.lower() for p in self.path_list])
        if not self.predicates:
            return path
        query_string = urlencode(self.predicates)
        return f"{path}?{query_string}"


class Page(UINode): pass
class Slot(UINode): pass
class Component(UINode): pass

