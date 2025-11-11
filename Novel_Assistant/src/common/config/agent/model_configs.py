"""
模型配置数据模型

用途：加载、验证并管理模型配置。

"""

from __future__ import annotations

from functools import cached_property
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

from ..loader import ConfigLoader, LoadError

class NodeModelItem(BaseModel):
    """单个节点的模型配置。

    必填：
      - model_name: 模型别名
      - base_url: 模型服务地址
      - api_key: 模型服务密钥

    可选：
      - config: 其他调用参数（如 temperature、top_p、max_tokens 等），若其他位置有配置则上层可选择忽略此处。
    """

    node_name: str = Field(..., description="节点名称")
    model_name: str = Field(..., description="模型别名（必填）")
    base_url: str = Field(..., description="模型服务地址（必填）")
    api_key: str = Field(..., description="模型服务密钥（必填）")
    config: Dict[str, Any] = Field(default_factory=dict, description="其他可选配置")

    @field_validator("node_name")
    @classmethod
    def validate_node_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("节点名称不能为空或仅空白字符")
        return v.strip()

    @field_validator("model_name")
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("模型别名(model_name)为必填项")
        return v.strip()

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("模型服务地址(base_url)为必填项")
        return v.strip()

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("模型服务密钥(api_key)为必填项")
        return v.strip()

    model_config = {
        "slots": True,  # 启用槽机制，节省内存
        "frozen": True,  
    }

class ModelConfig(BaseModel):
    """模型配置主对象。

    仅关注节点名、模型别名与服务地址；其他配置原样透传，交由上层决定是否忽略或覆盖。
    """

    nodes_config: List[NodeModelItem] = Field(..., description="节点模型配置列表", min_length=1)

    model_config = {
        "slots": True,
        "frozen": True,
    }
    
    @cached_property
    def node_to_model_name(self) -> Dict[str, str]:
        """节点名到模型名映射。"""
        return {item.node_name: item.model_name for item in self.nodes_config}

    @cached_property
    def node_to_base_url(self) -> Dict[str, str]:
        """key到模型服务地址映射（必有）。"""
        return {item.node_name: item.base_url for item in self.nodes_config}

    @cached_property
    def node_to_api_key(self) -> Dict[str, str]:
        """节点名到模型服务密钥映射。"""
        return {item.node_name: item.api_key for item in self.nodes_config}

    @cached_property
    def node_to_config(self) -> Dict[str, Dict[str, Any]]:
        """key到可选配置映射（可能为空字典）。"""
        return {item.node_name: item.config or {} for item in self.nodes_config}

    def get_model_name(self, key: str|None=None) -> Optional[str]:
        if key not in self.node_to_model_name or key is None:
            return self.node_to_model_name.get("default")
        return self.node_to_model_name.get(key)

    def get_base_url(self, key: str|None=None) -> Optional[str]:
        if key not in self.node_to_base_url or key is None:
            return self.node_to_base_url.get("default")
        return self.node_to_base_url.get(key)

    def get_api_key(self, key: str|None=None) -> Optional[str]:
        if key not in self.node_to_api_key or key is None:
            return self.node_to_api_key.get("default")
        return self.node_to_api_key.get(key)

    def get_config(self, key: str|None=None) -> Dict[str, Any]:
        if key not in self.node_to_config or key is None:
            return self.node_to_config.get("default", {})
        return self.node_to_config.get(key, {})

class ModelConfigLoader(ConfigLoader):
    """模型配置加载器。

    解析风格：以节点名作为顶层键；节点下至少包含 model_name 与 base_url，其余字段（如config）原样透传。
    若存在除节点对象之外的其他顶层键（例如别的配置来源），本加载器将忽略之。
    """

    def load_config(self) -> ModelConfig:

        file_path = self._get_config_file_path(filename="model_config")
        try:
            raw = self._load_yaml_file(file_path) or {}

            nodes: List[NodeModelItem] = []

            for key, value in raw.items():
                if not isinstance(value, dict):
                    continue
                item = NodeModelItem(
                    node_name=key,
                    model_name=value.get("model_name"),
                    base_url=value.get("base_url"),
                    api_key=value.get("api_key"),
                    config=value.get("config") or {},
                )
                nodes.append(item)

            if not nodes:
                raise LoadError("模型配置为空：至少需要一个节点配置")

            return ModelConfig(nodes_config=nodes)

        except Exception as e:
            if isinstance(e, LoadError):
                raise
            raise LoadError(f"创建模型配置对象失败: {e}")


# 全局配置加载器实例

global_model_config= ModelConfigLoader().load_config()


__all__ = [
    "global_model_config",
]