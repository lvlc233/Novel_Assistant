"""FastAPI application for ufan_agent."""
import asyncio
import os
from contextlib import asynccontextmanager

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from api.error_handler import register_exception_handlers
from api.routes.file.router import router as file_router
from api.routes.node.router import router as node_router
from api.routes.plugin.router import router as plugin_router
from api.routes.work.router import router as work_router
from common.config import settings
from common.log.log import logger
from infrastructure.pg.pg_client import async_session, engine
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from core.plugin.runtime import PluginInternalRegistry, PluginManager


async def _run_migrations() -> None:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_ini = os.path.abspath(os.path.join(base_dir, "..", "alembic.ini"))
    config = Config(alembic_ini)
    config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)
    await asyncio.to_thread(command.upgrade, config, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _run_migrations()
    
    # Initialize checkpointer tables
    try:
        # 初始化langgraph的checkpoint
        conn_string = settings.SQLALCHEMY_DATABASE_URI
        if "postgresql+asyncpg://" in conn_string:
            conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
        

        async with AsyncPostgresSaver.from_conn_string(conn_string) as checkpointer:
            await checkpointer.setup()
            
        logger.info("langgraph的checkpoint表已完成初始化")
    except Exception as e:
        logger.error(f"Failed to initialize checkpointer tables: {e}")
        raise e

        
    # 进行内部插件的扫描:或者可封装为一个函数+配置类
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    plugins_dir = os.path.join(base_dir, "plugin")
    internal_registry = PluginInternalRegistry()
    if os.path.exists(plugins_dir):
        internal_registry.discover_plugins(plugins_dir)
    app.state.internal_plugin_registry = internal_registry
    logger.info(f"已加载: {len(internal_registry.get_plugin_list())} 个内部插件定义")
    logger.info(f"已预实例化: {internal_registry}")
    async with async_session() as session:
        manager = PluginManager(session)
        for plugin_def in internal_registry.get_plugin_list():
            await manager.add_plugin_with_register(plugin_def)
    yield
    
    # 清理插件管理器
    # await plugin_manager.cleanup()
    logger.info("Plugin manager cleaned up")
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

    app.include_router(plugin_router, prefix=settings.API_V1_STR)
    app.include_router(work_router, prefix=settings.API_V1_STR)
    app.include_router(node_router, prefix=settings.API_V1_STR)
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

    @app.get("/")
    async def root():
        """Root endpoint redirecting to docs."""
        return RedirectResponse(url="/docs")

    return app

# Create the app instance
app = create_app()
