import pytest
from httpx import AsyncClient
from common.config import settings

API_V1 = settings.API_V1_STR

@pytest.mark.asyncio
async def test_create_document(client: AsyncClient, work_id):
    payload = {
        "title": "Test Document",
        "description": "Doc Description"
    }
    response = await client.post(f"{API_V1}/work/{work_id}/document", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["title"] == "Test Document"
    assert data["data"]["id"] is not None
    return data["data"]["id"]

@pytest.mark.asyncio
async def test_create_node_folder(client: AsyncClient, work_id):
    payload = {
        "name": "Test Folder",
        "description": "Folder Description",
        "type": "folder"
    }
    response = await client.post(f"{API_V1}/work/{work_id}/node", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["name"] == "Test Folder"
    return data["data"]["id"]

@pytest.mark.asyncio
async def test_get_document_detail(client: AsyncClient, work_id):
    # Create doc
    payload = {
        "title": "Test Document",
        "description": "Doc Description"
    }
    response = await client.post(f"{API_V1}/work/{work_id}/document", json=payload)
    assert response.status_code == 200
    doc_id = response.json()["data"]["id"]
    
    # Get detail
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["title"] == "Test Document"

@pytest.mark.asyncio
async def test_update_document(client: AsyncClient, work_id):
    # Create doc
    payload = {
        "title": "Test Document",
        "description": "Doc Description"
    }
    response = await client.post(f"{API_V1}/work/{work_id}/document", json=payload)
    doc_id = response.json()["data"]["id"]
    
    # Update Basic Info
    payload = {
        "title": "Updated Document"
    }
    response = await client.patch(f"{API_V1}/work/{work_id}/document/{doc_id}", json=payload)
    assert response.status_code == 200
    
    # Verify Basic Info Update
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}")
    data = response.json()
    assert data["data"]["title"] == "Updated Document"

    # Update Content (Version)
    # 1. Get versions to find current version ID
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}/version")
    assert response.status_code == 200
    versions = response.json()["data"]["versions"]
    assert len(versions) > 0
    # Assuming initial version is the only one or the first one. 
    # Usually "初始化版本" is created.
    version_ver = versions[0]["version"]

    # 2. Update content of that version
    payload_content = {
        "full_text": "Some content"
    }
    response = await client.patch(f"{API_V1}/work/{work_id}/document/{doc_id}/version/{version_ver}", json=payload_content)
    assert response.status_code == 200

    # Verify Content Update
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}")
    data = response.json()
    assert data["data"]["full_text"] == "Some content"

@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient, work_id):
    # Create doc
    payload = {
        "title": "Test Document",
        "description": "Doc Description"
    }
    response = await client.post(f"{API_V1}/work/{work_id}/document", json=payload)
    doc_id = response.json()["data"]["id"]
    
    # Delete
    response = await client.delete(f"{API_V1}/work/{work_id}/document/{doc_id}")
    assert response.status_code == 200
    
    # Verify
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}")
    # Based on implementation, could be 404 or error code
    if response.status_code == 200:
        data = response.json()
        assert data["code"] != 200 or data["data"] is None
    else:
        assert response.status_code in [404, 500]

@pytest.mark.asyncio
async def test_get_work_relationships(client: AsyncClient, work_id):
    # Create a doc
    payload = {
        "title": "Test Document",
        "description": "Doc Description"
    }
    await client.post(f"{API_V1}/work/{work_id}/document", json=payload)
    
    response = await client.get(f"{API_V1}/work/{work_id}/document")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    # Check if document list is present
    assert "document" in data["data"]
    assert len(data["data"]["document"]) >= 1
