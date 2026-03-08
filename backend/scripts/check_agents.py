import asyncio
import sys
from pathlib import Path

# Add backend/src to sys.path
backend_src = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(backend_src))

from infrastructure.pg.pg_client import async_session
from infrastructure.pg.pg_models import AgentsManagerSQLEntity
from sqlalchemy import select

async def main():
    print("Checking agents in DB...")
    async with async_session() as session:
        stmt = select(AgentsManagerSQLEntity)
        result = await session.execute(stmt)
        agents = result.scalars().all()
        print(f"Found {len(agents)} agents.")
        for a in agents:
            print(f"- {a.name}: {a.description}")

if __name__ == "__main__":
    asyncio.run(main())
