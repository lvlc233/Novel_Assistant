
from pathlib import Path

if __name__ == "__main__":
    import uvicorn
    import os

    from dotenv import load_dotenv
    # 加载.env文件
    # 修正.env文件路径
    env_path = Path(__file__).parent / ".config" / ".env"
    load_dotenv(dotenv_path=env_path, override=True, encoding="utf-8")
    os.environ["LANGSMITH_TRACING_V2"] = "true"

    # 安全地设置环境变量
    langchain_api_key = os.getenv("LANGCHAIN_API_KEY")
    if langchain_api_key:
        os.environ["LANGCHAIN_API_KEY"] = langchain_api_key

    langchain_project = os.getenv("LANGCHAIN_PROJECT")
    if langchain_project:
        os.environ["LANGCHAIN_PROJECT"] = langchain_project

    uvicorn.run(
        app="api.app:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
    print("Uvicorn server exited.")
