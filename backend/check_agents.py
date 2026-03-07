import asyncio
from sqlalchemy import select
from infrastructure.pg.pg_client import get_session, async_session
from infrastructure.pg.pg_models import AgentsManagerSQLEntity, PluginSQLEntity
from plugin.agent_manager.plugin import AgentManagerPlugin

async def check_agent_manager():
    print("--- Checking Agent Manager ---")
    async with async_session() as session:
        # 1. Check PluginSQLEntity for agents
        print("\n[PluginSQLEntity] Checking for plugins with 'agent' tag...")
        stmt_plugins = select(PluginSQLEntity)
        result_plugins = await session.execute(stmt_plugins)
        all_plugins = result_plugins.scalars().all()
        
        for p in all_plugins:
            tags = p.tags
            if tags and "agent" in tags:
                print(f"  - Found Agent Plugin: {p.name} (ID: {p.id}) | Tags: {tags}")
            else:
                pass # print(f"  - Ignored Plugin: {p.name} | Tags: {tags}")

        # 2. Check AgentsManagerSQLEntity
        print("\n[AgentsManagerSQLEntity] Checking registered agents...")
        stmt_agents = select(AgentsManagerSQLEntity)
        result_agents = await session.execute(stmt_agents)
        agents = result_agents.scalars().all()
        
        if not agents:
            print("  - No agents found in AgentsManagerSQLEntity table.")
        for a in agents:
            print(f"  - Registered Agent: {a.name} (ID: {a.id}) | Enabled: {a.enabled}")

        # 3. Simulate AgentManagerPlugin._sync_agents_from_plugins
        print("\n[Simulation] Simulating sync process...")
        # Create an instance (mocking checkpoint as None for this check)
        am_plugin = AgentManagerPlugin(session=session, checkpoint=None)
        await am_plugin._sync_agents_from_plugins()
        
        # Check again
        result_agents_after = await session.execute(stmt_agents)
        agents_after = result_agents_after.scalars().all()
        print(f"  - Agents after sync: {len(agents_after)}")
        for a in agents_after:
            print(f"    -> {a.name}")

if __name__ == "__main__":
    asyncio.run(check_agent_manager())
