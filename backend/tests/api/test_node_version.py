import pytest
from httpx import AsyncClient
from common.config import settings

API_V1 = settings.API_V1_STR

@pytest.mark.asyncio
async def test_document_version_switch(client: AsyncClient, work_id):
    # 1. Create Document
    payload = {
        "title": "Version Test Doc",
        "description": "Description"
    }
    response = await client.post(f"{API_V1}/work/{work_id}/document", json=payload)
    assert response.status_code == 200
    doc_id = response.json()["data"]["id"]

    # 2. Get Initial Version ID
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}/version")
    assert response.status_code == 200
    versions = response.json()["data"]["versions"]
    assert len(versions) > 0
    v1_id = versions[0]["id"]
    v1_ver = versions[0]["version"]
    
    # 3. Update Version 1 Content
    payload_v1 = {
        "full_text": "Content Version 1"
    }
    response = await client.patch(f"{API_V1}/work/{work_id}/document/{doc_id}/version/{v1_ver}", json=payload_v1)
    assert response.status_code == 200
    
    # Check current version
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}")
    data_v1 = response.json()["data"]
    assert data_v1["full_text"] == "Content Version 1"
    version_1_str = data_v1["now_version"]
    assert version_1_str == "初始化版本"

    # 4. Create Version 2
    # This snapshots current content ("Content Version 1") into new version "v2"
    response = await client.post(f"{API_V1}/work/{work_id}/document/{doc_id}/version", json={"version_name": "v2"})
    assert response.status_code == 200
    
    # Get Version 2 ID
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}/version")
    versions = response.json()["data"]["versions"]
    v2_id = None
    v2_ver = None
    for v in versions:
        if v["version"] == "v2":
            v2_id = v["id"]
            v2_ver = v["version"]
            break
    assert v2_id is not None
    assert v2_ver == "v2"
    
    # 5. Update Version 2 Content
    payload_v2 = {
        "full_text": "Content Version 2"
    }
    response = await client.patch(f"{API_V1}/work/{work_id}/document/{doc_id}/version/{v2_ver}", json=payload_v2)
    assert response.status_code == 200
    
    # Verify we are on v2
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}")
    data_v2 = response.json()["data"]
    assert data_v2["full_text"] == "Content Version 2"
    assert data_v2["now_version"] == "v2"

    # 6. Switch back to Version 1
    # This calls get_document_version_detail_and_switch
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}/version/{v1_ver}")
    assert response.status_code == 200
    data_switched = response.json()["data"]
    
    # Verify returned data is Version 1
    assert data_switched["full_text"] == "Content Version 1"
    assert data_switched["now_version"] == "初始化版本"
    
    # Verify the document state is persisted as Version 1
    response = await client.get(f"{API_V1}/work/{work_id}/document/{doc_id}")
    data_final = response.json()["data"]
    assert data_final["full_text"] == "Content Version 1"
    assert data_final["now_version"] == "初始化版本"
