import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from api.app import app
from common.clients.pg.pg_client import get_session
from core.domain.models import NovelItemUse2Overview
from common.enums import NovelState

# Mock the session dependency
@pytest.fixture(name="client")
async def client_fixture():
    async def get_session_override():
        yield AsyncMock(spec=AsyncSession)

    app.dependency_overrides[get_session] = get_session_override
    
    # raise_app_exceptions=False is important to test error handling middleware
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()

@pytest.mark.anyio
async def test_create_novel_success(client: AsyncClient):
    """
    Test successful novel creation.
    Should return 200 and the created novel details.
    """
    
    # Mock return value from service
    mock_novel = NovelItemUse2Overview(
        novel_id="novel_123",
        novel_cover_image_url="http://example.com/cover.jpg",
        novel_name="Test Novel",
        novel_summary="A test summary",
        novel_state=NovelState.UPDATING,
        novel_create_time=datetime.now().isoformat(),
        novel_update_time=datetime.now().isoformat(),
        novel_hiatus_interval=0,
        novel_word_count=0
    )
    
    # Payload for the request
    payload = {
        "user_id": "user_123",
        "novel_name": "Test Novel",
        "novel_summary": "A test summary",
        "novel_cover_image_url": "http://example.com/cover.jpg",
        "kd_id_list": []
    }
    
    # Patch the service function
    # Note: We must patch where it is IMPORTED in the router, not where it is defined.
    with patch("api.routers.novel_api.create_novel4service", new_callable=AsyncMock) as mock_service:
        mock_service.return_value = mock_novel
        
        response = await client.post("/novel/create_novel", json=payload)
        
        # Verify Response
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "200"
        assert data["data"]["novel_id"] == "novel_123"
        assert data["data"]["novel_name"] == "Test Novel"
        
        # Verify service call args
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["user_id"] == "user_123"
        assert call_kwargs["novel_name"] == "Test Novel"
        assert "session" in call_kwargs

@pytest.mark.anyio
async def test_create_novel_validation_error(client: AsyncClient):
    """Test validation error (missing required field user_id)"""
    payload = {
        "novel_name": "Test Novel"
        # missing user_id
    }
    
    response = await client.post("/novel/create_novel", json=payload)
    
    # FastAPI returns 422 for validation errors
    assert response.status_code == 422

@pytest.mark.anyio
async def test_create_novel_service_exception(client: AsyncClient):
    """Test exception handling when service fails"""
    payload = {
        "user_id": "user_123",
        "novel_name": "Test Novel"
    }
    
    # Mock service to raise exception
    with patch("api.routers.novel_api.create_novel4service", side_effect=Exception("Database Connection Failed")):
        response = await client.post("/novel/create_novel", json=payload)
        
        # Global exception handler should catch this and return 500
        assert response.status_code == 500
        data = response.json()
        assert data["code"] == "500"
        assert "Database Connection Failed" in data["message"]
