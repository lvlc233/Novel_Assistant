"""日志配置模块。.

本模块使用 loguru 实现结构化日志，支持按环境区分配置、文件轮转，
并为不同组件（API、Graph、LLM）提供分层日志。
"""

import os
import sys

from loguru import logger

APP_ENV = os.getenv("APP_ENV", "dev").lower()
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

#  -------------- 环境差异化配置 --------------
CFG = {
    # 开发环境
    "dev": {
        "console_lvl": "DEBUG",
        "file_lvl": "DEBUG",
        "serialize": False,
        "colorize": True,
        "sample": 1.0,
        "remote": False,
    },
    # 测试环境
    "test": {
        "console_lvl": "INFO",
        "file_lvl": "DEBUG",
        "serialize": True,
        "colorize": True,
        "sample": 1.0,
        "remote": False,
    },
    # 生产环境
    "prod": {
        "console_lvl": "ERROR",
        "file_lvl": "WARNING",
        "serialize": True,
        "colorize": False,
        "sample": 0.01,
        "remote": True,
    },
}
C = CFG[APP_ENV]

# -------------- 公共文件配置 --------------
COMMON_FILE = {
    "rotation": "1 day",
    "retention": "15 days",
    "compression": "gz",
    "encoding": "utf-8",
    "enqueue": True,
    "colorize": False,  # 文件日志不需要颜色，避免ANSI转义码
}


def _sampler(record: dict) -> bool:
    """按采样率丢弃日志."""
    import random

    return random.random() < C["sample"]


# 4. -------------- 统一 filter --------------
def env_filter(record) -> bool:
    return _sampler(record)


# 5. -------------- 移除默认 + 控制台 --------------
logger.remove()
logger.add(
    sys.stderr,
    level=C["console_lvl"],
    colorize=C["colorize"],
    format="<green>{time:MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{extra[layer]: <5}</cyan> | "
    "{message}",
    filter=env_filter,
)


#  -------------- 三种sink --------------
def add_layer_sink(path: str, layer: str):
    logger.add(
        os.path.join(LOG_DIR, f"{APP_ENV}_{path}"),
        filter=lambda r: r["extra"].get("layer") == layer and env_filter(r),
        level=C["file_lvl"],
        serialize=C["serialize"],
        **COMMON_FILE,
    )


add_layer_sink("api.jsonl", "API")
add_layer_sink("graph.jsonl", "GRAPH")
add_layer_sink("llm.jsonl", "LLM")


api_logger = logger.bind(layer="API")
graph_logger = logger.bind(layer="GRAPH")
llm_logger = logger.bind(layer="LLM")

__all__ = ["api_logger", "graph_logger", "llm_logger"]
