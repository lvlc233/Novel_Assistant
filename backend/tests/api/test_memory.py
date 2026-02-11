import pytest
from httpx import AsyncClient
from common.config import settings
from common.enums import MemoryTypeEnum

API_V1 = settings.API_V1_STR

@pytest.mark.asyncio
async def test_create_memory(client: AsyncClient):
    payload = {
        "name": "Test Memory",
        "type": MemoryTypeEnum.LONG_TERM,
        "description": "Memory Description",
        "context": "Memory Context"
    }
    response = await client.post(f"{API_V1}/plugin/memory", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["name"] == "Test Memory"
    return data["data"]["id"]

@pytest.mark.asyncio
async def test_get_memory_list(client: AsyncClient):
    await test_create_memory(client)
    
    response = await client.get(f"{API_V1}/plugin/memory")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert len(data["data"]) >= 1

@pytest.mark.asyncio
async def test_get_memory_detail(client: AsyncClient):
    memory_id = await test_create_memory(client)
    
    response = await client.get(f"{API_V1}/plugin/memory/{memory_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["id"] == memory_id
    assert data["data"]["type"] == MemoryTypeEnum.LONG_TERM

@pytest.mark.asyncio
async def test_update_memory(client: AsyncClient):
    memory_id = await test_create_memory(client)
    
    payload = {
        "enabled": False,
        "name": "Updated Memory",
        "description": "Updated Desc"
    }
    response = await client.patch(f"{API_V1}/plugin/memory/{memory_id}", json=payload)
    assert response.status_code == 200
    
    # Verify
    response = await client.get(f"{API_V1}/plugin/memory/{memory_id}")
    data = response.json()
    assert data["data"]["name"] == "Updated Memory"
    assert data["data"]["enabled"] == False

@pytest.mark.asyncio
async def test_delete_memory(client: AsyncClient):
    memory_id = await test_create_memory(client)
    
    response = await client.delete(f"{API_V1}/plugin/memory/{memory_id}")
    assert response.status_code == 200
    
    # Verify
    response = await client.get(f"{API_V1}/plugin/memory/{memory_id}")
    if response.status_code == 200:
        data = response.json()
        assert data["code"] != 200
    else:
        assert response.status_code in [404, 500]
