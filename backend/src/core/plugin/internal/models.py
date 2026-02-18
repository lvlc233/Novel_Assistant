

from typing import Any, Dict
from common.enums import LoaderType
from core.plugin.base.models import BaseOperationBuilder, BasePluginOperation


class InternalOperationBuilder(BaseOperationBuilder):
    """内部操作构建器"""
    # 内部操作使用基础方法即可
    pass

class InternalPluginOperation(BasePluginOperation[InternalOperationBuilder]):
    """内部插件操作"""
    
    def __init__(self):
        super().__init__(LoaderType.INTERNAL, InternalOperationBuilder)

