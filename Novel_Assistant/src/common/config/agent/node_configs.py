"""
节点配置数据模型

定义了图配置文件中各种节点配置的Pydantic模型，
用于加载、验证和管理YAML配置文件中的节点配置信息。
"""

from typing import List, Dict, Optional
from functools import cached_property
from pydantic import BaseModel, Field, field_validator
from ..loader import ConfigLoader,LoadError


class Business(BaseModel):
    """业务配置模型"""
    type: str = Field(..., description="业务类型")
    criterion: str = Field(..., description="业务判断标准")

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        allowed_types = ["signified", "pending_confirmation"]
        if v not in allowed_types:
            raise ValueError(f"业务类型必须是 {allowed_types} 中的一个")
        return v
    @field_validator('criterion')
    @classmethod
    def validate_criterion(cls, v):
        if not v or not v.strip():
            raise ValueError("业务判断标准不能为空或仅空白字符")
        return v
    


class NodeItem(BaseModel):
    """统一节点配置模型
    
    将熔断节点概念融入到意指节点中，所有节点都是意图识别后的处理入口
    """
    node_name: str = Field(..., description="节点名称")
    business: List[Business] = Field(..., description="业务配置列表")
    router_tag: str = Field(..., description="路由标签")
    hierarchy: int = Field(default=0, ge=0, description="层级，0表示基础意指节点")
    on_trigger: str = Field(default="", description="触发后的目标节点")

    @field_validator('node_name')
    @classmethod
    def validate_node_name(cls, v):
        if not v or not v.strip():
            raise ValueError("节点名称不能为空或仅空白字符")
        return v.strip()

    @field_validator('business')
    @classmethod
    def validate_business(cls, v):
        if not v:
            raise ValueError("业务配置列表不能为空")
        return v

    @field_validator('router_tag')
    @classmethod
    def validate_router_tag(cls, v):
        if not v or not v.strip():
            raise ValueError("路由标签不能为空或仅空白字符")
        return v.strip()

    @field_validator('on_trigger')
    @classmethod
    def validate_on_trigger(cls, v):
        return v.strip()
    model_config = {
        "slots": True,          # 启用槽机制，节省内存
        "frozen": True          # Pydantic v2：使用 frozen 替代 allow_mutation
    }

class NodeConfig(BaseModel):
    """节点配置模型"""
    nodes_config: List[NodeItem] = Field(..., description="节点配置列表", min_length=1)

    model_config = {
        "slots": True,          # 启用槽机制，节省内存
        "frozen": True          # Pydantic v2：使用 frozen 替代 allow_mutation
    }

    @cached_property
    def _business_type_mapping(self) -> Dict[str, List[NodeItem]]:
        """缓存的业务类型映射表"""
        mapping: Dict[str, List[NodeItem]] = {}
        for node in self.nodes_config:
            for business in node.business:
                if business.type not in mapping:
                    mapping[business.type] = []
                mapping[business.type].append(node)
        return mapping

    @cached_property
    def signified_nodes(self) -> List[NodeItem]:
        """获取所有意指节点（缓存）"""
        return self._business_type_mapping.get("signified", [])
    
    @cached_property
    def pending_confirmation_nodes(self) -> List[NodeItem]:
        """获取所有待确认节点（缓存）"""
        return self._business_type_mapping.get("pending_confirmation", [])
        
    @cached_property
    def signified_nodes_no_pending_confirmation(self) -> List[NodeItem]:
        """获取所有意指节点（缓存）"""
        return [node for node in self.signified_nodes if node not in self.pending_confirmation_nodes]


    @cached_property
    def gateway_after_nodes(self) -> List[NodeItem]:
        """获取既是意指节点又是待确认节点的交集（缓存）"""
        # 使用节点名称进行集合操作，避免NodeItem不可哈希的问题
        signified_names = {node.node_name for node in self.signified_nodes}
        pending_names = {node.node_name for node in self.pending_confirmation_nodes}
        intersection_names = signified_names & pending_names
        
        # 返回交集中的NodeItem对象
        result = []
        for node in self.nodes_config:
            if node.node_name in intersection_names:
                result.append(node)
        return result


    @cached_property
    def business_type_criterion_mapping(self) -> Dict[str, Dict[str, str]]:
        """按业务类型分组的路由标签到判断标准映射表（缓存）
        
        返回格式：
        {
            "signified": {"chat": "当用户想和Agent聊餐饮相关的内容时", ...},
            "pending_confirmation": {"order_build": "当用户希望Agent为用户构建订单时...", ...}
        }
        """
        mapping: Dict[str, Dict[str, str]] = {}
        
        for node in self.nodes_config:
            for business in node.business:
                business_type = business.type
                if business_type not in mapping:
                    mapping[business_type] = {}
                mapping[business_type][node.router_tag] = business.criterion
                
        return mapping

    def get_criterion_by_type_and_tag(self, business_type: str, router_tag: str) -> str | None:
        """根据业务类型和路由标签获取判断标准"""
        return self.business_type_criterion_mapping.get(business_type, {}).get(router_tag)
    
    @cached_property
    def signified_tag_criterion_mapping(self) -> Dict[str, str]:
        """路由标签到业务判断标准的映射表（缓存）- 兼容性保留"""
        return self.business_type_criterion_mapping.get("signified", {})
        
    @cached_property
    def gateway_tag_criterion_mapping(self) -> Dict[str, str]:
        """路由标签到业务判断标准的映射表（缓存）- 兼容性保留"""
        return self.business_type_criterion_mapping.get("pending_confirmation", {})


class NodeConfigLoader(ConfigLoader):
    def load_config(self, filename: str|None = None) -> NodeConfig:
        """加载节点配置
        
        Args:
            filename: 配置文件名（不含扩展名）
            
        Returns:
            NodeConfig: 节点配置对象
            
        Raises:
            LoadError: 配置加载或验证失败
        """
        if not filename:
            filename = "graph_config"
        
        file_path = self._get_config_file_path(filename)
        # 加载YAML文件
        try:
            config_data = self._load_yaml_file(file_path)
            
            # 验证和创建配置对象
            node_config = NodeConfig(**config_data)
            
            return node_config
            
        except Exception as e:
            if isinstance(e, LoadError):
                raise
            raise LoadError(f"创建节点配置对象失败: {e}")

def load_default_node_config() -> NodeConfig:
    loader = get_global_node_config_loader()
    return loader.load_config()
# 全局配置加载器实例
_global_node_config_loader: Optional[NodeConfigLoader] = None


def get_global_node_config_loader(config_dir: str|None = None) -> NodeConfigLoader:
    """获取全局配置加载器实例"""
    global _global_node_config_loader
    if _global_node_config_loader is None:
        _global_node_config_loader = NodeConfigLoader(config_dir)
    return _global_node_config_loader

