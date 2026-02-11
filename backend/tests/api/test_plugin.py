import pytest
from httpx import AsyncClient
from common.config import settings

API_V1 = settings.API_V1_STR

@pytest.mark.asyncio
async def test_get_plugin_list(client: AsyncClient, plugin_id):
    response = await client.get(f"{API_V1}/plugin")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert len(data["data"]) >= 1
    
    # Check if created plugin is in list
    found = False
    for p in data["data"]:
        # Normalize UUID comparison
        if str(p["id"]).replace("-", "") == str(plugin_id).replace("-", ""):
            found = True
            break
    assert found

@pytest.mark.asyncio
async def test_get_plugin_detail(client: AsyncClient, plugin_id):
    response = await client.get(f"{API_V1}/plugin/{plugin_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert str(data["data"]["id"]).replace("-", "") == str(plugin_id).replace("-", "")
    assert data["data"]["name"] == "Test Plugin"

@pytest.mark.asyncio
async def test_update_plugin(client: AsyncClient, plugin_id):
    payload = {
        "enabled": False,
        "config": {"key": "value"}
    }
    response = await client.patch(f"{API_V1}/plugin/{plugin_id}", json=payload)
    assert response.status_code == 200
    
    # Verify
    response = await client.get(f"{API_V1}/plugin/{plugin_id}")
    data = response.json()
    assert data["data"]["enabled"] == False
    assert data["data"]["config"] == {"key": "value"}
