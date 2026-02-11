import pytest
from httpx import AsyncClient
from common.config import settings
from infrastructure.pg.pg_models import AgentsManagerSQLEntity

API_V1 = settings.API_V1_STR

@pytest.mark.asyncio
async def test_get_agent_list(client: AsyncClient, db_session):
    # Insert an agent
    agent = AgentsManagerSQLEntity(
        name="Test Agent",
        description="Desc",
        context_size=100,
        is_summary=False,
        enabled=True,
        broadcast=True,
        config={"context_size": 100, "is_summary": False}, # Populate config to be safe if service uses it
        sessions=[] 
    )
    db_session.add(agent)
    await db_session.flush()
    
    response = await client.get(f"{API_V1}/plugin/agent/manager")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert len(data["data"]) >= 1
    
    found = False
    for a in data["data"]:
        # Normalize UUIDs for comparison
        if a["id"].replace("-", "") == str(agent.id).replace("-", ""):
            found = True
            break
    assert found

@pytest.mark.asyncio
async def test_get_agent_detail(client: AsyncClient, db_session):
    # Insert an agent
    agent = AgentsManagerSQLEntity(
        name="Detail Agent",
        description="Desc",
        context_size=100,
        is_summary=False,
        enabled=True,
        broadcast=True,
        config={"context_size": 100, "is_summary": False},
        sessions=[]
    )
    db_session.add(agent)
    await db_session.flush()
    
    response = await client.get(f"{API_V1}/plugin/agent/manager/{agent.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["id"].replace("-", "") == str(agent.id).replace("-", "")
    assert data["data"]["name"] == "Detail Agent"

@pytest.mark.asyncio
async def test_update_agent(client: AsyncClient, db_session):
    # Insert an agent
    agent = AgentsManagerSQLEntity(
        name="Update Agent",
        description="Desc",
        context_size=100,
        is_summary=False,
        enabled=True,
        broadcast=True,
        sessions=[]
    )
    db_session.add(agent)
    await db_session.flush()
    
    payload = {
        "broadcast": False
    }
    response = await client.patch(f"{API_V1}/plugin/agent/manager/{agent.id}", json=payload)
    assert response.status_code == 200
    
    # Verify
    response = await client.get(f"{API_V1}/plugin/agent/manager/{agent.id}")
    data = response.json()
    assert data["data"]["broadcast"] == False

@pytest.mark.asyncio
async def test_create_session(client: AsyncClient, db_session):
    # Insert an agent
    agent = AgentsManagerSQLEntity(
        name="Session Agent",
        description="Desc",
        context_size=100,
        is_summary=False,
        enabled=True,
        broadcast=True,
        sessions=[]
    )
    db_session.add(agent)
    await db_session.flush()
    
    # Use a valid UUID for session_id
    import uuid
    session_id = str(uuid.uuid4())
    response = await client.post(f"{API_V1}/plugin/agent/manager/{agent.id}/history/{session_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    # Assuming it returns empty messages or similar
    assert "messages" in data["data"]
