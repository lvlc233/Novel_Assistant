import pytest
from httpx import AsyncClient
from common.config import settings

# Prefix
API_V1 = settings.API_V1_STR

async def create_work_helper(client: AsyncClient, name="Test Work"):
    payload = {
        "name": name,
        "summary": "This is a test work",
        "type": "novel",
        "enabled_plugin_id_list": []
    }
    response = await client.post(f"{API_V1}/work", json=payload)
    assert response.status_code == 200, f"Create work failed: {response.text}"
    data = response.json()
    assert data["code"] == 200
    return data["data"]["meta"]["id"]

@pytest.mark.asyncio
async def test_create_work(client: AsyncClient):
    work_id = await create_work_helper(client)
    assert work_id is not None

@pytest.mark.asyncio
async def test_get_work_list(client: AsyncClient):
    # First create one
    await create_work_helper(client)
    
    response = await client.get(f"{API_V1}/work")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert len(data["data"]) >= 1

@pytest.mark.asyncio
async def test_get_work_detail(client: AsyncClient):
    work_id = await create_work_helper(client)
    
    response = await client.get(f"{API_V1}/work/{work_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["meta"]["id"] == work_id

@pytest.mark.asyncio
async def test_update_work(client: AsyncClient):
    # Create
    work_id = await create_work_helper(client)
    
    # Update
    payload = {
        "name": "Updated Work",
        "state": "完成" # WorkStateCNEnum.COMPLETED
    }
    response = await client.patch(f"{API_V1}/work/{work_id}", json=payload)
    assert response.status_code == 200
    
    # Verify
    response = await client.get(f"{API_V1}/work/{work_id}")
    data = response.json()
    assert data["data"]["meta"]["name"] == "Updated Work"
    assert data["data"]["meta"]["state"] == "完成"

@pytest.mark.asyncio
async def test_delete_work(client: AsyncClient):
    # Create
    work_id = await create_work_helper(client)
    
    # Delete
    response = await client.delete(f"{API_V1}/work/{work_id}")
    assert response.status_code == 200
    
    # Verify
    response = await client.get(f"{API_V1}/work/{work_id}")
    # Assuming 200 with error code or 404/500
    if response.status_code == 200:
        data = response.json()
        assert data["code"] != 200 or data["data"] is None
    else:
        assert response.status_code in [404, 500]
