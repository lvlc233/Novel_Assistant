"""FastAPI application for ufan_agent."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.pg.pg_client import engine
from common.config import settings
from api.routes.novel.router import router as novel_router
from api.routes.document.router import router as document_router
from api.error_handler import register_exception_handlers
from common.log.log import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
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

    # Routers (Prefixes are defined in the router instances)
    app.include_router(novel_router)
    app.include_router(document_router)

    # Register global exception handlers
    register_exception_handlers(app)

    return app

# Create the app instance
app = create_app()
