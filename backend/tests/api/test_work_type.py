import pytest
from httpx import AsyncClient
from common.config import settings
from infrastructure.pg.pg_models import WorkTypeSQLEntity

API_V1 = settings.API_V1_STR

@pytest.mark.asyncio
async def test_get_work_type_list(client: AsyncClient, db_session):
    # Insert a work type
    work_type = WorkTypeSQLEntity(
        name="novel",
        enabled=True,
        tags=["folder", "document"],
        relationship=["parent"],
        configurable=True
    )
    db_session.add(work_type)
    await db_session.flush()

    response = await client.get(f"{API_V1}/plugin/work/type")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert len(data["data"]) >= 1
    assert data["data"][0]["type"] == "novel"

@pytest.mark.asyncio
async def test_get_work_type_detail(client: AsyncClient, db_session):
    # Insert a work type
    work_type = WorkTypeSQLEntity(
        name="script",
        enabled=True,
        tags=["folder", "document"],
        relationship=["parent"],
        configurable=True
    )
    db_session.add(work_type)
    await db_session.flush()

    response = await client.get(f"{API_V1}/plugin/work/type/{work_type.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    # Normalize UUID for comparison
    assert data["data"]["id"].replace("-", "") == str(work_type.id).replace("-", "")
