
import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.pg.pg_client import async_session
from infrastructure.pg.pg_models import PluginSQLEntity
from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum, WorkTypeEnum

async def init_plugins():
    plugins_data = [
        # 1. Knowledge Base Plugin
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "知识库",
            "description": "知识库插件配置信息,你可以针对你的某个作品进行知识库的配置,注意:每个作品的知识库都是独立隔离的。(不支持向量搜索, search_key作为渐进式暴露)",
            "from_type": PluginFromTypeEnum.OFFICIAL,
            "scope_type": PluginScopeTypeEnum.WORK,
            "enabled": True,
            "config_schema": {
                "id": "UUID",
                "work_id": "UUID",
                "title": "str",
                "description": "str",
                "create_at": "datetime",
                "enabled": "bool",
                "chunks": [
                    {
                        "name": "str",
                        "content": "str",
                        "search_keys": "List[str]",
                        "enabled": "bool",
                        "create_at": "datetime"
                    }
                ]
            },
            "default_config": {},
            "tags": ["Tool"]
        },
        # 2. Memory Plugin
        {
            "id": "00000000-0000-0000-0000-000000000002",
            "name": "记忆",
            "description": "记忆插件配置信息,记忆是全局的,并且会直接加载到所有的Agent中。您可以直接传入记忆,但是推荐不要太多。系统会对记忆的内容进行自动的整理。",
            "from_type": PluginFromTypeEnum.OFFICIAL,
            "scope_type": PluginScopeTypeEnum.GLOBAL,
            "enabled": False,
            "config_schema": {
                "id": "UUID",
                "name": "str",
                "type": "MemoryTypeEnum",
                "enabled": "bool",
                "description": "str",
                "context": "str",
                "create_at": "datetime"
            },
            "default_config": {},
            "tags": ["Tool"]
        },
        # 3. Work Type Management
        {
            "id": "00000000-0000-0000-0000-000000000003",
            "name": "作品类型管理",
            "description": "作品类型管理,可以配置整个项目运行时候支持怎么样的作品类型。系统提供的类型一般不可修改,用户自定义的可以修改。",
            "from_type": PluginFromTypeEnum.SYSTEM,
            "scope_type": PluginScopeTypeEnum.GLOBAL,
            "enabled": True,
            "config_schema": {
                "types": [
                    {
                        "id": "UUID",
                        "work_type": "str",
                        "node_tags": "List[str]",
                        "relationship": "List[dict[str, str]]",
                        "configurable": "bool"
                    }
                ]
            },
            "default_config": {
                "types": [
                    {
                        "id": "00000000-0000-0000-0000-000000000001",
                        "work_type": "novel",
                        "node_tags": ["document", "folder"],
                        "relationship": [{"folder": "document"}],
                        "configurable": False
                    }
                ]
            },
            "tags": []
        },
        # 4. Agent Management Plugin
        {
            "id": "00000000-0000-0000-0000-000000000004",
            "name": "Agent管理插件",
            "description": "Agent管理插件,用于管理Agent的元信息,这个插件会自动扫描tag中含有'Agent'的Agent,将其注册到系统中。并进行数据结构的检测。",
            "from_type": PluginFromTypeEnum.SYSTEM,
            "scope_type": PluginScopeTypeEnum.GLOBAL,
            "enabled": True,
            "config_schema": {
                "agents": [
                    {
                        "id": "UUID",
                        "name": "str",
                        "context_size": "int",
                        "is_summary": "bool",
                        "description": "str",
                        "sessions": "list[str]",
                        "enabled": "bool",
                        "broadcast": "bool"
                    }
                ]
            },
            "default_config": {
                "agents": [
                    {
                        "id": "00000000-0000-0000-0000-000000000005",
                        "name": "项目助手",
                        "context_size": 24000,
                        "is_summary": False,
                        "description": "用于辅助用户了解整个项目的Agent",
                        "enabled": True,
                        "broadcast": False
                    },
                    {
                        "id": "00000000-0000-0000-0000-000000000006",
                        "name": "小说创作助手", # Mapped from '文档创作助手' logically, but let's stick to the doc's config mapping
                        # Wait, the doc says "小说创作助手" in default_config of Agent Manager, but defines "文档创作助手" (ID ...06) later.
                        # I should match the ID references.
                        # ID ...05 is "项目助手"
                        # ID ...06 is "文档创作助手"
                        # The default_config of Agent Manager lists ID ...02 as "小说创作助手". Wait.
                        # Doc says:
                        # Agent Manager default_config: 
                        #   { id: ...01, name: 项目助手 } -> But "项目助手" plugin definition has ID ...05
                        #   { id: ...02, name: 小说创作助手 } -> But "memory" has ID ...02. This seems like a doc inconsistency or independent ID scope.
                        #   However, usually these refer to the Plugin IDs if they are "Agents".
                        #   But "项目助手" has ID ...05.
                        #   Let's check the Agent definitions below.
                        #   "项目助手" ID ...05.
                        #   "文档创作助手" ID ...06.
                        #   So the Agent Manager default config should probably refer to ...05 and ...06.
                        #   BUT, the doc says:
                        #   Agent Manager default_config:
                        #     id: ...001 (not ...005)
                        #     id: ...002 (not ...006)
                        #   This implies the `agents` list in `Agent Management Plugin` configuration might be a separate list of "Active Agent Instances" or similar, OR the doc has inconsistent IDs.
                        #   Given "Agent管理插件... 自动扫描tag中含有'Agent'的Agent,将其注册到系统中", 
                        #   it's likely that the `default_config` in `Agent Management Plugin` is just an *example* or *initial state* of what it manages.
                        #   The actual Agents are defined as Plugins ...05 and ...06.
                        #   So, I will register Plugins ...05 and ...06 as "Agent" plugins.
                        #   And I will keep the `default_config` of `Agent Management Plugin` as is (with ...01, ...02) OR update it to match ...05, ...06 to be helpful.
                        #   Updating to ...05 and ...06 makes more sense for a consistent system.
                        #   Let's map:
                        #   ...05 -> 项目助手
                        #   ...06 -> 文档创作助手 (The doc calls it "文档创作助手" later, but "小说创作助手" in the manager list. I will use "文档创作助手" to match the plugin definition).
                        
                        "id": "00000000-0000-0000-0000-000000000006",
                        "name": "文档创作助手", 
                        "context_size": 50000,
                        "is_summary": True,
                        "description": "用于辅助用户创作文档的Agent",
                        "enabled": True,
                        "broadcast": True
                    }
                ]
            },
            "tags": []
        },
        # 5. Project Agent
        {
            "id": "00000000-0000-0000-0000-000000000005",
            "name": "项目助手",
            "description": "项目助手,用于辅助用户了解整个项目的Agent",
            "from_type": PluginFromTypeEnum.OFFICIAL,
            "scope_type": PluginScopeTypeEnum.GLOBAL,
            "enabled": True,
            "config_schema": {
                "name": "str",
                "model_name": "str",
                "base_url": "str",
                "api_key": "str",
                "user_prompt": "str",
                "tools": "dict[str,str]"
            },
            "default_config": {
                "tools": {
                    "memory": None
                }
            },
            "tags": ["Agent"]
        },
        # 6. Document Creation Agent
        {
            "id": "00000000-0000-0000-0000-000000000006",
            "name": "文档创作助手",
            "description": "文档创作助手,用于辅助用户创作文档的Agent",
            "from_type": PluginFromTypeEnum.OFFICIAL,
            "scope_type": PluginScopeTypeEnum.DOCUMENT,
            "enabled": True,
            "config_schema": {
                "name": "str",
                "model_name": "str",
                "base_url": "str",
                "api_key": "str",
                "user_prompt": "str",
                "tools": "dict[str,str]"
            },
            "default_config": {
                "tools": {
                    "memory": None,
                    "document": None
                }
            },
            "tags": ["Agent"]
        }
    ]

    async with async_session() as session:
        print("Starting plugin initialization...")
        for plugin_data in plugins_data:
            stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_data["id"])
            result = await session.execute(stmt)
            existing_plugin = result.scalar_one_or_none()

            if existing_plugin:
                print(f"Updating plugin: {plugin_data['name']} ({plugin_data['id']})")
                existing_plugin.name = plugin_data["name"]
                existing_plugin.description = plugin_data["description"]
                existing_plugin.from_type = plugin_data["from_type"]
                existing_plugin.scope_type = plugin_data["scope_type"]
                existing_plugin.enabled = plugin_data["enabled"]
                existing_plugin.config_schema = plugin_data["config_schema"]
                existing_plugin.default_config = plugin_data["default_config"]
                existing_plugin.tags = plugin_data["tags"]
            else:
                print(f"Creating plugin: {plugin_data['name']} ({plugin_data['id']})")
                new_plugin = PluginSQLEntity(
                    id=UUID(plugin_data["id"]),
                    name=plugin_data["name"],
                    description=plugin_data["description"],
                    from_type=plugin_data["from_type"],
                    scope_type=plugin_data["scope_type"],
                    enabled=plugin_data["enabled"],
                    config_schema=plugin_data["config_schema"],
                    default_config=plugin_data["default_config"],
                    tags=plugin_data["tags"]
                )
                session.add(new_plugin)
        
        await session.commit()
        print("Plugin initialization completed.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(init_plugins())
