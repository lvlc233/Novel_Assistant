
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

# Adjust imports based on your project structure
from api.app import app
from common.clients.pg.pg_client import get_session
from common.clients.pg.pg_models import UserSQLEntity, NovelSQLEntity, DocumentMetadataSQLEntity, DocumentVersionSQLEntity

# Use in-memory SQLite for testing the SQL logic
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(name="session")
async def session_fixture():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

    await engine.dispose()

@pytest.fixture(name="client")
async def client_fixture(session: AsyncSession):
    # Override the get_session dependency
    async def get_session_override():
        yield session

    app.dependency_overrides[get_session] = get_session_override
    
    # Adapt to newer httpx
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()

@pytest.mark.anyio
async def test_get_novels_with_word_count(session: AsyncSession, client: AsyncClient):
    """
    Integration test for /get_novels to verify the GROUP BY aggregation logic.
    """
    # 1. Prepare Data
    user_id = "user_test_001"
    
    # User
    user = UserSQLEntity(user_id=user_id, user_name="Test User", user_password="pwd")
    session.add(user)
    
    # Novel 1: Has 2 docs, total 300 words
    novel1 = NovelSQLEntity(user_id=user_id, novel_name="Novel 1", novel_is_remove=False)
    session.add(novel1)
    await session.flush() # get IDs
    
    # Novel 2: Has 0 docs, total 0 words
    novel2 = NovelSQLEntity(user_id=user_id, novel_name="Novel 2", novel_is_remove=False)
    session.add(novel2)
    
    # Novel 3: Removed (should not appear)
    novel3 = NovelSQLEntity(user_id=user_id, novel_name="Novel Removed", novel_is_remove=True)
    session.add(novel3)

    # Documents for Novel 1
    # Doc 1: 100 words
    # We need to manage IDs to satisfy constraints
    doc1_id = "doc_1"
    ver1_id = "ver_1"
    
    ver1 = DocumentVersionSQLEntity(
        document_version_id=ver1_id,
        document_id=doc1_id,
        document_word_count=100
    )
    session.add(ver1)
    
    doc1 = DocumentMetadataSQLEntity(
        document_id=doc1_id,
        user_id=user_id, 
        novel_id=novel1.novel_id, 
        document_current_version_id=ver1_id,
        document_is_remove=False
    )
    session.add(doc1)

    # Doc 2: 200 words
    doc2_id = "doc_2"
    ver2_id = "ver_2"
    
    ver2 = DocumentVersionSQLEntity(
        document_version_id=ver2_id,
        document_id=doc2_id,
        document_word_count=200
    )
    session.add(ver2)
    
    doc2 = DocumentMetadataSQLEntity(
        document_id=doc2_id,
        user_id=user_id, 
        novel_id=novel1.novel_id, 
        document_current_version_id=ver2_id,
        document_is_remove=False
    )
    session.add(doc2)
    
    # Doc 3: Removed (should not count)
    doc3_id = "doc_3"
    ver3_id = "ver_3"
    
    ver3 = DocumentVersionSQLEntity(
        document_version_id=ver3_id,
        document_id=doc3_id,
        document_word_count=500
    )
    session.add(ver3)
    
    doc3 = DocumentMetadataSQLEntity(
        document_id=doc3_id,
        user_id=user_id, 
        novel_id=novel1.novel_id, 
        document_current_version_id=ver3_id,
        document_is_remove=True # REMOVED
    )
    session.add(doc3)

    await session.commit()

    # 2. Call API
    # The app includes router with prefix "/novel"
    response = await client.post("/novel/get_novels", json={"user_id": user_id})
    
    # 3. Verify Response
    assert response.status_code == 200
    data = response.json()
    assert str(data["code"]) == "200" # Assuming Response.ok wrapper
    novels = data["data"]
    
    assert len(novels) == 2
    
    # Verify Order (Create time desc, but we created close together. Usually Novel 2 is newer)
    # Let's find by ID
    n1_res = next(n for n in novels if n["novel_id"] == novel1.novel_id)
    n2_res = next(n for n in novels if n["novel_id"] == novel2.novel_id)
    
    # Check Word Counts
    assert n1_res["novel_word_count"] == 300 # 100 + 200 (Ignore 500 from removed doc)
    assert n2_res["novel_word_count"] == 0
    
    print("\nTest Passed: Aggregation Logic Correct!")
