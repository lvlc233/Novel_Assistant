"""
配置管理模块

提供配置驱动的图系统支持，包括：
- YAML配置文件加载和验证
- 配置模型定义和验证
- 运行时组件生成（枚举、路由、提示词等）
- 配置热更新和缓存管理

主要组件：
- ConfigLoader: 配置文件加载器
- GraphConfig: 图配置数据模型
- GraphConfigGenerator: 配置组件生成器
"""

from .agent.node_configs import (
    load_default_node_config,
    get_global_node_config_loader,
    NodeConfig,
    NodeItem,
)
from .agent.model_configs import (
    ModelConfig,    
)



__all__ = [
    "load_default_node_config",
    "get_global_node_config_loader",
    "NodeConfig",
    "NodeItem",

    "load_default_model_config",
    "get_global_model_config_loader",
    "ModelConfig",
]
# 版本信息
__version__ = "1.0.0"