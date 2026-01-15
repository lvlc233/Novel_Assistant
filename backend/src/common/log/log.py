"""日志配置模块。

本模块使用 loguru 实现结构化日志，支持按环境区分配置、文件轮转。
简化配置：统一输出到控制台和文件，移除复杂的采样和分层。
"""

import os
import sys
from loguru import logger

APP_ENV = os.getenv("APP_ENV", "dev").lower()
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

# 环境配置
LOG_CONFIG = {
    "dev": {"level": "DEBUG", "serialize": False},
    "test": {"level": "INFO", "serialize": True},
    "prod": {"level": "WARNING", "serialize": True},
}

config = LOG_CONFIG.get(APP_ENV, LOG_CONFIG["dev"])

# 移除默认handler
logger.remove()

# 控制台输出
logger.add(
    sys.stderr,
    level=config["level"],
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
)

# 文件输出 (按天轮转，保留15天)
logger.add(
    os.path.join(LOG_DIR, f"app_{APP_ENV}.log"),
    rotation="1 day",
    retention="15 days",
    compression="zip",
    encoding="utf-8",
    level=config["level"],
    serialize=config["serialize"],
    enqueue=True,
)

__all__ = ["logger"]
