"""启动 FastAPI 应用的入口脚本."""
import os
import argparse
import uvicorn
from dotenv import load_dotenv


# 加载环境变量(本地)
def _load_env() -> None:
    load_dotenv(override=True, encoding="utf-8")


def _parse_args() -> argparse.Namespace:
    """解析命令行参数:用于动态配置host和port"""
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str)
    parser.add_argument("--port", type=int)
    return parser.parse_args()

def main():
    _load_env()
    args = _parse_args()
    host = args.host or os.getenv("HOST") or "0.0.0.0"
    env_port = args.port if args.port is not None else os.getenv("PORT")
    port = int(env_port) if env_port is not None else 8426
    uvicorn.run(app="src.api.app:app", host=host, port=port, log_level="debug", reload=True)
    
    
if __name__ == "__main__":
    main()