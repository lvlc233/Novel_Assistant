"""FastAPI application for ufan_agent."""
import asyncio
from math import log
import os
from contextlib import asynccontextmanager

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession

from api.error_handler import register_exception_handlers
from api.routes.agent.document_helper.router import router as document_helper_router
# from api.routes.agent.project_helper.router import router as project_helper_router
from api.routes.agent.router import router as agent_router
from api.routes.file.router import router as file_router
# from api.routes.kd.router import router as kd_router
# from api.routes.memory.router import router as memory_router
from api.routes.node.router import router as node_router
from api.routes.plugin.router import router as plugin_router
from api.routes.work.router import router as work_router
# from api.routes.work_type.router import router as work_type_router
from common.config import settings
from common.log.log import logger
from infrastructure.langgraph.checkpointer import PostgresCheckpointer
from infrastructure.pg.pg_client import engine
# from core.plugin.manager import PluginManager
# from core.plugin.operation_scanner import scan_and_register_operations
# from core.plugin.operation_registry import PluginOperationRegistry
# from services.memory.service import MemoryService
from services.work.service import WorkService
from services.agent.service import AgentService
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
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    # TODO: 这里应该不需要,因为langgraph会自动进行checkpointer的初始化
    # checkpointer = PostgresCheckpointer(conn_string)
    # await checkpointer.setup()
    # logger.info("LangGraph Checkpointer tables initialized")
    

    # TODO:扫描项目中的插件,并加载到数据库中?那还有必要存储到数据中吗?我们都是使用本地代码扫描的方式加载插件了...要怎么设计呢?
    # 初始化插件管理器: 加载插件信息到内存中
    # plugin_manager = PluginManager()
    # async with AsyncSession(engine) as session:
    #     await plugin_manager.load_all_plugins(session)
    # logger.info(f"已加载: {len(plugin_manager.definitions)} 个插件定义")
    # logger.info(f"已预实例化: {len(plugin_manager.instances)} 个全局插件实例")
    
    # # 挂载到app状态
    # app.state.plugin_manager = plugin_manager
    # logger.info("插件管理器挂载完成")
    
    # #  TODO: 这里合理吗?
    # service_classes = [MemoryService, WorkService, AgentService]
    # async with AsyncSession(engine) as session:
    #     await scan_and_register_operations(service_classes, session)
    # logger.info(f"Registered {len(PluginOperationRegistry.get_all_operations())} plugin operations")
    

    # # 动态创建插件操作路由
    # operation_map = PluginOperationRegistry.get_all_operations()
    # for op_key, handler in operation_map.items():
    #     plugin_id, operation_name = op_key.split(":")
    #     app.add_api_route(
    #         f"/plugin/{plugin_id}/operation/{operation_name}",
    #         handler,
    #         methods=["POST"]
    #     )
    # logger.info(f"Created {len(operation_map)} plugin operation routes")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    plugins_dir = os.path.join(base_dir, "plugin")
    internal_registry = PluginInternalRegistry()
    if os.path.exists(plugins_dir):
        internal_registry.discover_plugins(plugins_dir)
    app.state.internal_plugin_registry = internal_registry
    logger.info(f"已加载: {len(internal_registry.get_plugin_list())} 个内部插件定义")
    logger.info(f"已预实例化: {internal_registry}")
    async with AsyncSession(engine) as session:
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

    # Routers
    # app.include_router(novel_router) # Legacy
    # app.include_router(document_router) # Legacy
    
    # Specific plugin routers must be registered BEFORE the generic plugin router
    # app.include_router(kd_router, prefix=settings.API_V1_STR)
    app.include_router(agent_router, prefix=settings.API_V1_STR)
    # app.include_router(memory_router, prefix=settings.API_V1_STR)
    # Generic plugin router (catch-all for /plugin/{id})
    app.include_router(plugin_router, prefix=settings.API_V1_STR)
    
    app.include_router(work_router, prefix=settings.API_V1_STR)
    app.include_router(node_router, prefix=settings.API_V1_STR)
    app.include_router(document_helper_router, prefix=settings.API_V1_STR)
    # app.include_router(project_helper_router, prefix=settings.API_V1_STR)
    app.include_router(file_router, prefix=settings.API_V1_STR)
    # app.include_router(work_type_router, prefix=settings.API_V1_STR)

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
