"""FastAPI application for ufan_agent."""
from contextlib import asynccontextmanager
from sqlmodel import SQLModel

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import user_api, novel_api,document_api
from api.error_handler import register_exception_handlers
from common.clients.pg.pg_client import engine
import logging


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)





@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    logging.info("数据库初始化完成")

    yield
    await engine.dispose()
    logging.info("数据库连接关闭")
    


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Novel Assistant API",
        description="基于LangGraph构建的小说助手智能体API",
        version="0.0.1",
        lifespan=lifespan,
        
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(user_api.router, prefix="/user")
    app.include_router(novel_api.router,prefix="/novel")
    app.include_router(document_api.router,prefix="/document")

    # Register global exception handlers
    register_exception_handlers(app)

    return app


# Create the app instance
app = create_app()
