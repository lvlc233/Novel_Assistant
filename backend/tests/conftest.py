import sys
import os
import asyncio
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Ensure src is in python path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "src"))

from api.app import app
from common.config import settings
from infrastructure.pg.pg_client import get_session
from infrastructure.pg.pg_models import PluginSQLEntity
from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum

from sqlalchemy.pool import NullPool

# Use the same database URL but ensure async
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

# Create a dedicated engine for testing to manage connections explicitly
test_engine = create_async_engine(DATABASE_URL, echo=False, future=True, poolclass=NullPool)

@pytest_asyncio.fixture
async def db_session():
    """
    Creates a fresh sqlalchemy session for each test that operates in a transaction.
    The transaction is rolled back at the end of each test ensuring a clean state.
    """
    connection = await test_engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)

    # Monkey patch commit to flush to prevent actual commit to database
    # This allows multiple requests in a test to see changes without persisting them
    async def mock_commit():
        print("DEBUG: Mock commit called")
        await session.flush()
    
    session.commit = mock_commit

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()

@pytest_asyncio.fixture
async def work_id(client):
    """Creates a work and returns its ID."""
    payload = {
        "name": "Fixture Work",
        "summary": "Fixture Summary",
        "type": "novel",
        "enabled_plugin_id_list": []
    }
    response = await client.post(f"{settings.API_V1_STR}/work", json=payload)
    assert response.status_code == 200
    return response.json()["data"]["meta"]["id"]

@pytest_asyncio.fixture
async def plugin_id(db_session):
    """Creates a plugin and returns its ID."""
    plugin = PluginSQLEntity(
        name="Test Plugin",
        description="Test Description",
        from_type=PluginFromTypeEnum.OFFICIAL,
        scope_type=PluginScopeTypeEnum.WORK,
        default_config={}
    )
    db_session.add(plugin)
    await db_session.flush()
    return plugin.id

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    
    # Using ASGITransport for direct app testing without running a server
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    
    app.dependency_overrides.clear()
