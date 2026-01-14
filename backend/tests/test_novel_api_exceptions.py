
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

# Adjust imports based on your project structure
from api.app import app
from common.clients.pg.pg_client import get_session
from common.clients.pg.pg_models import UserSQLEntity

# Use in-memory SQLite for testing the SQL logic
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(name="session")
async def session_fixture():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

    await engine.dispose()

@pytest.fixture(name="client")
async def client_fixture(session: AsyncSession):
    # Override the get_session dependency
    async def get_session_override():
        yield session

    app.dependency_overrides[get_session] = get_session_override
    
    # Adapt to newer httpx
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()

@pytest.mark.anyio
async def test_get_novels_user_not_found(session: AsyncSession, client: AsyncClient):
    """
    Test /get_novels when the user does not exist.
    Expects a 500 error with a specific business error code (UserNotFoundError).
    """
    # 1. Do NOT create any user in the DB.
    user_id = "non_existent_user_001"
    
    # 2. Call API
    response = await client.post("/novel/get_novels", json={"user_id": user_id})
    
    # 3. Verify Response
    # Currently, BaseError is handled by base_error_handler which returns 500.
    assert response.status_code == 500
    
    data = response.json()
    # Code 5102 corresponds to UserNotFoundError
    assert data["code"] == "5102" 
    # The message should indicate the user was not found
    assert "用户不存在" in data["message"]
    assert user_id in data["message"]

@pytest.mark.anyio
async def test_get_novels_generic_exception(session: AsyncSession, client: AsyncClient):
    """
    Test /get_novels when an unexpected exception occurs (e.g., DB error).
    Expects a 500 error with a generic error message.
    """
    user_id = "user_test_error"
    
    # Create user to bypass the check_user check
    user = UserSQLEntity(user_id=user_id, user_name="Test User", user_password="pwd")
    session.add(user)
    await session.commit()
    
    # Mock the service to raise a generic exception
    with patch("api.routers.novel_api.get_novel_existing_overview_list4service", side_effect=Exception("Database Connection Failed")):
        response = await client.post("/novel/get_novels", json={"user_id": user_id})
        
        # Verify Response
        assert response.status_code == 500
        data = response.json()
        assert data["code"] == "500"
        assert "Database Connection Failed" in data["message"]
