from pydantic import BaseModel, Field, SecretStr
from typing import Literal, Optional, Dict, Any
# 模型配置
class LLMConfig(BaseModel):
    agent: Literal["facade", "memory", "recommendation", "KD"]
    provider: Literal["openai", "anthropic", "gemini", "qianwen"]
    model_name: str
    api_key: SecretStr
    temperature: float = 0.7
    max_tokens: int = 2048
# 检查点配置
class CheckpointConfig(BaseModel):
    backend: Literal["memory", "postgres", "sqlite"] = "postgres"
    connection_string: Optional[str] = None   # None 用默认库
# KD缓存配置
class CacheConfig(BaseModel):
    backend: Literal["memory", "redis", "postgres"] = "postgres"
    redis_url: Optional[str] = None
# 除了config,关系数据的配置
class RDBConfig(BaseModel):
    backend: Literal["postgres", "sqlite"] = "postgres"

class VectorDBConfig(BaseModel):
    backend: Literal["postgres", "mivlus"] = "postgres"

class GraphDBConfig(BaseModel):
    backend: Literal["postgres", "neo4j"] = "postgres"

# 文档数据库配置
class DocumentDBConfig(BaseModel):
    backend: Literal["postgres", "es"] = "postgres"

    

# # ---------- 根配置 ----------
# class AgentSettings(BaseModel):
#     llms: Dict[str, LLMConfig] = Field(..., description="4 个不同 LLM 实例")
#     tables: Dict[str, TableConfig] = Field(..., description="6+ 张表独立配置")

#     class Config:
#         json_encoders = {SecretStr: lambda v: v.get_secret_value() if v else None}