from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from dotenv import load_dotenv
from alembic import context
import os

# 加载 .env 文件
load_dotenv()

# Alembic 配置对象，用来读取 alembic.ini 里的设置
config = context.config

# 如果存在配置文件，就把其中的 [loggers] 日志配置加载到 Python logging 模块
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 下面两行把项目里所有 SQLModel 实体导入，目的是把这些表注册到 SQLModel.metadata，
# 这样 alembic revision --autogenerate 才能比较出模型与数据库的差异
from common.clients.pg.pg_models import *  # noqa: F401
# from common.clients.pg.checkpoint_models import *  # noqa: F401
from common.errors import DBURLNotFoundError
# 要检测/生成的目标元数据，所有模型都挂在这个 metadata 上
target_metadata = SQLModel.metadata

# ---------------- 离线模式 ----------------
def run_migrations_offline() -> None:
    """
    离线运行迁移：只根据 URL 生成 SQL 文本，不真正连库执行。
    适合 DBA 审核 SQL 或 CI 中生成脚本。
    """
    # 优先用环境变量 DATABASE_URL，否则读 alembic.ini 的 sqlalchemy.url
    url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
    if not url:
        raise DBURLNotFoundError(url)          # 自定义异常：找不到数据库地址

    # 配置 Alembic 上下文，literal_binds=True 会把参数直接拼进 SQL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    # 开始事务（离线模式事务只是形式），执行迁移
    with context.begin_transaction():
        context.run_migrations()

# ---------------- 在线模式 ----------------
def do_run_migrations(connection: Connection) -> None:
    """
    真正连接数据库的同步迁移函数，会被异步引擎回调。
    """
    # 把连接和模型元数据传给 Alembic
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """
    在线异步方式：创建 asyncpg 引擎 -> 取连接 -> 跑迁移 -> 关闭。
    """
    # 读取 alembic.ini 的 [alembic] 段，并强制把 url 换成环境变量 DATABASE_URL

    db_url = os.getenv("DATABASE_URL")

    # 手动创建引擎以控制 SSL 参数
    connectable = create_async_engine(
        db_url.split('?')[0],  # 移除查询字符串
        poolclass=pool.NullPool,
    )


    # 异步获取连接，再用 run_sync 把同步的 do_run_migrations 跑在异步连接里
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    # 迁移完成后关闭引擎
    await connectable.dispose()

def run_migrations_online() -> None:
    """
    在线模式入口：用 asyncio 启动异步迁移协程。
    """
    import asyncio
    asyncio.run(run_async_migrations())

# 判断当前是离线还是在线，自动走对应分支
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()