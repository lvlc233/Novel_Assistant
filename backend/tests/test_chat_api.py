import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from langchain_core.messages import AIMessage

from api.app import app

# Fixture for client (similar to other tests)
@pytest.fixture(name="client")
async def client_fixture():
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.mark.anyio
async def test_send_query_success(client: AsyncClient):
    """Test successful chat query"""
    query = "Hello AI"
    expected_response = "Hello Human"
    
    # Mock result from agent
    mock_result = {
        "messages": [
            AIMessage(content=expected_response)
        ]
    }
    
    # Patch the chat_helper in the router module
    with patch("api.routers.chat_api.chat_helper", new_callable=AsyncMock) as mock_agent:
        mock_agent.ainvoke.return_value = mock_result
        
        payload = {"query": query}
        response = await client.post("/chat/query", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "200"
        assert data["data"] == expected_response
        
        # Verify call arguments
        # mock_agent.ainvoke.assert_called_once() # Verify called
        args, kwargs = mock_agent.ainvoke.call_args
        assert args[0]["messages"][0].content == query

@pytest.mark.anyio
async def test_send_query_validation_error(client: AsyncClient):
    """Test validation error (missing query)"""
    payload = {} # Missing query
    response = await client.post("/chat/query", json=payload)
    assert response.status_code == 422

@pytest.mark.anyio
async def test_send_query_agent_exception(client: AsyncClient):
    """Test exception from agent"""
    with patch("api.routers.chat_api.chat_helper", new_callable=AsyncMock) as mock_agent:
        mock_agent.ainvoke.side_effect = Exception("Agent Error")
        
        payload = {"query": "test"}
        response = await client.post("/chat/query", json=payload)
        
        assert response.status_code == 500
        data = response.json()
        assert "Agent Error" in data["message"]
