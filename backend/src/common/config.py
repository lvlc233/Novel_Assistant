from typing import List, Union

from dotenv import load_dotenv
from pydantic import PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

# 显式加载 .env 到 os.environ，确保 LangChain 等库能自动读取 KEY
load_dotenv(override=True)

class Settings(BaseSettings):
    """全局配置类，自动加载环境变量(.env)."""
    
    # 基础配置
    PROJECT_NAME: str = "Novel Assistant API"
    VERSION: str = "0.0.1"
    API_V1_STR: str = "/api/v1"  # 预留API版本前缀
    
    # 服务器配置
    HOST: str = "0.0.0.0" # nosec
    PORT: int = 8426
    LOG_LEVEL: str = "INFO"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # 数据库配置
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str | None = None # 生产环境必须通过环境变量设置
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "novel_ai"
    
    # 优先读取 DATABASE_URL，如果没有则通过 computed_field 组装
    DATABASE_URL: Union[PostgresDsn, str, None] = None

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if isinstance(self.DATABASE_URL, str) and self.DATABASE_URL:
            url = self.DATABASE_URL
        elif self.DATABASE_URL:
             url = str(self.DATABASE_URL)
        else:
            if not self.POSTGRES_PASSWORD:
                # 在开发环境如果没有设置密码，可以尝试使用默认空密码或者抛出警告
                # 这里为了安全起见，如果不提供密码且不提供URL，应该抛出错误或使用空字符串(取决于DB配置)
                # 假设本地开发默认密码是 postgres，但为了安全不应硬编码在代码库中
                # 暂时保留 None，如果连接失败则是用户责任
                pass
            
            password = self.POSTGRES_PASSWORD or "postgres" # Fallback for local dev only if needed, but better to enforce env var

            url = str(PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=password,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            ))
        
        # Ensure async driver is used
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # LLM 配置 (示例)
    OPENAI_API_KEY: str | None = None
    OPENAI_API_BASE: str | None = None
    
    # CopilotKit
    COPILOTKIT_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
