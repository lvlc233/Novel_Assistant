
import sys
import os
import uuid

# Add backend/src to path
src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
# Add parent of backend to path
root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

print(f"Adding path: {src_path}")
sys.path.insert(0, src_path)
print(f"Adding path: {root_path}")
sys.path.insert(0, root_path)

try:
    from core.plugin.utils import build_plugin_id
    
    plugin_id_am = build_plugin_id("system", "Agent管理器")
    print(f"Calculated ID (system/Agent管理器): {plugin_id_am}")
    
    plugin_id_am_en = build_plugin_id("system", "agent_manager")
    print(f"Calculated ID (system/agent_manager): {plugin_id_am_en}")

    # Also check what's in DB
    import asyncio
    from infrastructure.pg.pg_client import async_session
    from infrastructure.pg.pg_models import PluginSQLEntity
    from sqlalchemy import select

    async def check_db():
        async with async_session() as session:
            stmt = select(PluginSQLEntity).where(
                (PluginSQLEntity.name == "Agent管理器") | 
                (PluginSQLEntity.name == "agent_manager")
            )
            result = await session.execute(stmt)
            plugins = result.scalars().all()
            for p in plugins:
                print(f"DB Plugin: {p.name} (ID: {p.id}) | From: {p.from_type}")

    if __name__ == "__main__":
        asyncio.run(check_db())

except Exception as e:
    print(f"Error: {e}")
