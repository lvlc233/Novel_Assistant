"""FastAPI application for ufan_agent."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import chat, health
from .error import register_exception_handlers



# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """应用生命周期管理器"""
#     pass


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Novel Assistant API",
        description="基于LangGraph构建的小说助手智能体API",
        version="0.0.1",
        # lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 在生产环境中应该配置具体的域名
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health.router, prefix="/chat/api/v1")
    # app.include_router(chat.router, prefix="/chat/api/v1")

    # Register global exception handlers
    register_exception_handlers(app)

    return app


# Create the app instance
app = create_app()