

from typing import Any, Dict
from backend.src.common.enums import LoaderType
from backend.src.core.plugin.base.models import BaseOperationBuilder, BasePluginOperation


class InternalOperationBuilder(BaseOperationBuilder):
    """内部操作构建器"""
    # 内部操作使用基础方法即可
    pass

class InternalPluginOperation(BasePluginOperation[InternalOperationBuilder]):
    """内部插件操作"""
    
    def __init__(self):
        super().__init__(LoaderType.INTERNAL, InternalOperationBuilder)

class InternalLoader(PluginLoader):
    """内部服务加载器"""
    
    async def load(self, config: Dict[str, Any]):
        """调用内部服务端点"""
        endpoint = config.get("endpoint")
        if not endpoint:
            raise ValueError("Internal endpoint configuration is required")
        
        # TODO: 实现内部服务调用逻辑
        # 这里可以调用其他FastAPI路由或内部函数
        

