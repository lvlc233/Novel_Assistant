"""启动 FastAPI 应用的入口脚本."""
import sys
import os
import uvicorn
import argparse

# Ensure src is in python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from common.config import settings

def _parse_args() -> argparse.Namespace:
    """解析命令行参数:用于动态配置host和port"""
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str)
    parser.add_argument("--port", type=int)
    return parser.parse_args()

def main():
    args = _parse_args()
    # 优先使用命令行参数，否则使用配置文件的值
    host = args.host or settings.HOST
    port = args.port if args.port is not None else settings.PORT
    
    uvicorn.run(
        app="src.api.app:app", 
        host=host, 
        port=port, 
        log_level=settings.LOG_LEVEL.lower(), 
        reload=True
    )
    
if __name__ == "__main__":
    main()
