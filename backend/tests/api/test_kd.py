import pytest
from uuid import uuid4
from httpx import AsyncClient
from common.config import settings

API_V1 = settings.API_V1_STR

@pytest.mark.asyncio
async def test_create_kd(client: AsyncClient, work_id):
    payload = {
        "name": "Test KD",
        "work_id": work_id,
        "description": "Test KD Description"
    }
    response = await client.post(f"{API_V1}/plugin/kd", json=payload)
    assert response.status_code == 200, f"Failed: {response.text}"
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["title"] == "Test KD"
    return data["data"]["id"]

@pytest.mark.asyncio
async def test_create_kd_chunk(client: AsyncClient, work_id):
    kd_id = await test_create_kd(client, work_id)
    
    chunk_id = str(uuid4())
    payload = {
        "chunk_id": chunk_id,
        "search_keys": ["key1", "key2"],
        "context": "Knowledge context"
    }
    response = await client.post(f"{API_V1}/plugin/kd/{kd_id}", json=payload)
    assert response.status_code == 200, f"Failed: {response.text}"
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["chunk_id"] == chunk_id
    
    return kd_id, chunk_id

@pytest.mark.asyncio
async def test_get_kd_list(client: AsyncClient, work_id):
    await test_create_kd(client, work_id)
    
    response = await client.get(f"{API_V1}/plugin/kd")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert len(data["data"]) >= 1

@pytest.mark.asyncio
async def test_get_kd_detail(client: AsyncClient, work_id):
    kd_id, chunk_id = await test_create_kd_chunk(client, work_id)
    
    response = await client.get(f"{API_V1}/plugin/kd/{kd_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    # detail returns list of chunks
    assert len(data["data"]) >= 1
    assert data["data"][0]["chunk_id"] == chunk_id

@pytest.mark.asyncio
async def test_update_kd(client: AsyncClient, work_id):
    kd_id = await test_create_kd(client, work_id)
    
    payload = {
        "enabled": False,
        "name": "Updated KD",
        "description": "Updated Desc"
    }
    response = await client.patch(f"{API_V1}/plugin/kd/{kd_id}", json=payload)
    assert response.status_code == 200
    
    # Verify via list
    response = await client.get(f"{API_V1}/plugin/kd")
    data = response.json()
    found = False
    for item in data["data"]:
        if item["id"] == kd_id:
            assert item["title"] == "Updated KD"
            assert item["enabled"] == False
            found = True
            break
    assert found

@pytest.mark.asyncio
async def test_delete_kd(client: AsyncClient, work_id):
    kd_id = await test_create_kd(client, work_id)
    
    response = await client.delete(f"{API_V1}/plugin/kd/{kd_id}")
    assert response.status_code == 200
