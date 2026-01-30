"""PostgreSQL Client Module."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from common.config import settings

# Database Setup
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with async_session() as session:
        yield session

class PGClient:
    """PostgreSQL Client - Legacy/User Wrapper."""
    
    def __init__(self, session: AsyncSession):
        """Initialize PostgresClient."""
        self.session = session
