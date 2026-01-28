"""FastAPI application for ufan_agent."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.error_handler import register_exception_handlers
from api.routes.agent.router import router as agent_router
from api.routes.file.router import router as file_router
from api.routes.knowledge_base.router import router as knowledge_base_router
from api.routes.memory.router import router as memory_router
from api.routes.node.router import router as node_router

# Old Routers (Legacy) - Commented out due to model refactoring
# from api.routes.novel.router import router as novel_router
# from api.routes.document.router import router as document_router
# New Routers (Refactored)
from api.routes.plugin.router import router as plugin_router
from api.routes.work.router import router as work_router
from common.config import settings
from common.log.log import logger
from infrastructure.langgraph.checkpointer import PostgresCheckpointer
from infrastructure.pg.pg_client import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize checkpointer tables
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    
    checkpointer = PostgresCheckpointer(conn_string)
    await checkpointer.setup()
    logger.info("LangGraph Checkpointer tables initialized")

    # 使用自定义的日志。
    logger.info("数据库初始化完成")
    yield
    await engine.dispose()
    logger.info("数据库连接关闭")

def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="基于LangGraph构建的小说助手智能体API",
        version=settings.VERSION,
        lifespan=lifespan,
        # openapi_url: OpenAPI文档的访问路径
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.API_V1_STR else "/openapi.json",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    # app.include_router(novel_router) # Legacy
    # app.include_router(document_router) # Legacy
    
    app.include_router(plugin_router, prefix=settings.API_V1_STR)
    app.include_router(work_router, prefix=settings.API_V1_STR)
    app.include_router(node_router, prefix=settings.API_V1_STR)
    app.include_router(agent_router, prefix=settings.API_V1_STR)
    app.include_router(knowledge_base_router, prefix=settings.API_V1_STR)
    app.include_router(memory_router, prefix=settings.API_V1_STR)
    app.include_router(file_router, prefix=settings.API_V1_STR)

    # Mount static files
    # Resolve absolute path to static directory: src/static
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/src
    static_dir = os.path.join(base_dir, "static")
    if not os.path.exists(static_dir):
        os.makedirs(static_dir, exist_ok=True)
    
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

    # Register global exception handlers
    register_exception_handlers(app)

    return app

# Create the app instance
app = create_app()
