from typing import List, Dict, Any
import inspect
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from common.config import settings
from core.plugin.di import Inject
from core.ui.home import Home
from core.plugin.annotations import plugin_meta, operation, runtime_config
from common.enums import PluginFromTypeEnum, UITrigger
from infrastructure.pg.pg_client import get_session
from infrastructure.pg.pg_models import AgentsManagerSQLEntity, PluginSQLEntity
from core.plugin.utils import build_plugin_id
from core.plugin.runtime import PluginInternalRegistry
from services.plugin.service import PluginService

async def get_checkpoint() -> AsyncPostgresSaver:
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    return AsyncPostgresSaver.from_conn_string(conn_string)

@plugin_meta(
    name="Agent管理器",
    space="system", 
    version="0.0.1",
    description="用于管理Agent的插件,主要是邮箱开启功能和消息会话管理统一入口",
    from_type=PluginFromTypeEnum.SYSTEM
)
class AgentManagerPlugin:
    
    @runtime_config
    def __init__(
        self,
        session: AsyncSession=Inject(get_session),
        checkpoint: AsyncPostgresSaver=Inject(get_checkpoint),
    ):
        self.session = session
        self.checkpoint = checkpoint
    
    async def _get_email_config(self) -> Dict[str, bool]:
        """获取AgentManager的邮件配置 (agent_name -> enabled)"""
        # 注意: 这里 space 必须与 plugin_meta 中的 space 一致
        # plugin_meta 中 space="system", name="Agent管理器"
        plugin_id = build_plugin_id("system", "Agent管理器")
        print(f"[AgentManager] Fetching config for plugin_id: {plugin_id}")
        
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            print(f"[AgentManager] Plugin not found in DB for id: {plugin_id}")
            return {}
        
        if not plugin.runtime_config:
            print("[AgentManager] No runtime_config found")
            return {}
        
        return plugin.runtime_config.get("email_config", {})

    async def _save_email_config(self, config: Dict[str, bool]):
        """保存AgentManager的邮件配置"""
        plugin_id = build_plugin_id("system", "Agent管理器")
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if plugin:
            current_config = dict(plugin.runtime_config or {})
            current_config["email_config"] = config
            plugin.runtime_config = current_config
            await self.session.commit()
            print(f"[AgentManager] Config saved: {config}")
        else:
            print(f"[AgentManager] Failed to save config: Plugin {plugin_id} not found")

    async def _sync_agents_from_plugins(self):
        """同步插件中的Agent到Agent管理器"""
        print("[AgentManager] Syncing agents from plugins...")
        # 1. 获取所有带有 'agent' 标签的插件
        # 注意: JSON 数组包含查询可能因数据库方言而异，这里在 Python 中过滤
        stmt_plugins = select(PluginSQLEntity)
        result_plugins = await self.session.execute(stmt_plugins)
        all_plugins = result_plugins.scalars().all()
        
        # 修正: tags 可能是 list 或 None，确保安全访问
        agent_plugins = []
        for p in all_plugins:
            if p.tags and isinstance(p.tags, list) and "agent" in p.tags:
                agent_plugins.append(p)
                
        print(f"[AgentManager] Found {len(agent_plugins)} plugins with 'agent' tag")
        
        # 2. 获取现有的 AgentManager 实体
        stmt_agents = select(AgentsManagerSQLEntity)
        result_agents = await self.session.execute(stmt_agents)
        existing_agents = result_agents.scalars().all()
        existing_agent_names = {a.name for a in existing_agents}
        
        new_agents = []
        for plugin in agent_plugins:
            if plugin.name not in existing_agent_names:
                print(f"[AgentManager] Registering new agent from plugin: {plugin.name}")
                new_agent = AgentsManagerSQLEntity(
                    name=plugin.name,
                    description=plugin.description,
                    enabled=True,
                    broadcast=False,
                    context_size=-1,
                    is_summary=False,
                    config={}
                )
                self.session.add(new_agent)
                new_agents.append(new_agent)
        
        if new_agents:
            await self.session.commit()
            print(f"[AgentManager] Registered {len(new_agents)} new agents")
        else:
            print("[AgentManager] No new agents to register")

    @operation(
        name="get_agent_info",
        description="获取Agent信息,用于在邮箱侧边栏显示",
        with_ui=[Home.EmailBoot.filter()],
        ui_target=Home.EmailBox.AgentBox,
        trigger = UITrigger.CLICK
    )
    async def get_agent_info(self):
        """获取Agent信息"""
        print("[AgentManager] get_agent_info called")
        try:
            # 0. 同步 Agent
            await self._sync_agents_from_plugins()

            # 1. 获取所有注册的Agent
            stmt = select(AgentsManagerSQLEntity)
            result = await self.session.execute(stmt)
            agents = result.scalars().all()
            print(f"[AgentManager] Found {len(agents)} agents in DB")
            
            # 2. 获取邮件配置
            email_config = await self._get_email_config()
            
            agent_list = []
            
            async with self.checkpoint as checkpointer:
                for agent in agents:
                    history_items = []
                    # 获取该Agent的所有会话
                    if agent.sessions:
                        for session_id in agent.sessions:
                            # 获取会话历史 (Checkpoint)
                            # 注意: 这里假设 checkpoint 存储时 thread_id = session_id
                            # aget 返回的是 CheckpointTuple, 其中 checkpoint 是状态字典
                            checkpoint_tuple = await checkpointer.aget({"configurable": {"thread_id": session_id}})
                            
                            messages = []
                            if checkpoint_tuple and checkpoint_tuple.checkpoint:
                                # 尝试从 channel_values 中获取 messages
                                # LangGraph 的状态通常在 channel_values 中
                                channel_values = checkpoint_tuple.checkpoint.get("channel_values", {})
                                # 假设 messages key 存在
                                raw_messages = channel_values.get("messages", [])
                                # 简单序列化 messages (这里可能需要更复杂的转换，视 Message 对象结构而定)
                                messages = [
                                    {"type": getattr(m, "type", "unknown"), "content": getattr(m, "content", str(m))} 
                                    for m in raw_messages
                                ]

                            history_items.append({
                                "agent_name": agent.name,
                                "session_id": session_id,
                                "messages": messages
                            })
                    
                    agent_list.append({
                        "agent_name": agent.name,
                        "on_email": email_config.get(agent.name, False), # 默认为 False
                        "history": history_items
                    })

            # 3. 封装为 List[AgentMessageHistoryItem]的字典并返回
            # 注意：前端可能期待 {"AgentMessages": [...], "Email": ...} 或者是列表
            # 根据 user provided snippet: registed={"AgentMessages":..., "Email":...}
            # 这里 Home.EmailBox 可能期待的是列表或者特定结构。
            # 假设直接返回 List[Email] 结构
            print(f"[AgentManager] Returning {len(agent_list)} agents info")
            return agent_list
        except Exception as e:
            print(f"[AgentManager] Error in get_agent_info: {e}")
            import traceback
            traceback.print_exc()
            raise e
    
    @operation(
        name="get_agent_info_in_card",
        description="获取Agent信息,在卡片信息中展示内容",
        with_ui=[Home.PluginExpand.PluginCard.filter(name="agent_manager")],
        ui_target=Home.PluginDetails.Info,
        trigger = UITrigger.CLICK
    )
    async def get_agent_info_in_card(self):
        """获取Agent信息"""
        print("[AgentManager] get_agent_info_in_card called")
        # 复用 get_agent_info 的逻辑
        data = await self.get_agent_info()
        
        # 封装为 Home.PluginDetails.Info的字典并返回,其中type选择"AgentMessages"
        # 根据 Home 定义: Info(name:str ,data: dict, info_type:str)
        # 这里返回的是构造 Info 组件所需的参数字典
        return {
            "name": "agent_manager",
            "data": {"agents": data},
            "info_type": "AgentMessages" # 对应前端 registed key
        }
    


    @operation(
    name="update_agent_email_state",
        description="更新插件中的Agent邮件状态(是否开启)",
        with_ui=[Home.PluginDetails.Info.filter(name="agent_manager")],
        trigger = UITrigger.CLICK
    )
    async def update_agent_email_state(self, agent_name: str, on_email: bool):
        # 持久化到 AgentManager 插件的配置中
        email_config = await self._get_email_config()
        email_config[agent_name] = on_email
        await self._save_email_config(email_config)
        return {"success": True, "agent_name": agent_name, "on_email": on_email}

    @operation(
        name="proxy_send_agent_message",
        description="代理发送Agent消息",
        with_ui=[Home.EmailBox.AgentBox.filter()],
        trigger = UITrigger.ENTER
    )
    async def proxy_send_agent_message(self, agent_name: str, message: str, session_id: str):
        # 1. 查找目标插件
        # 注意：这里我们假设插件名就是 agent_name。
        # 实际上 AgentsManagerSQLEntity 可能有不同的 name，但我们先假设一致。
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.name == agent_name)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        
        if not plugin:
            yield {"status": "error", "message": f"Agent plugin '{agent_name}' not found"}
            return
            
        # 2. 获取 Registry
        registry = PluginInternalRegistry.get_global()
        if not registry:
            yield {"status": "error", "message": "Plugin registry not initialized"}
            return
             
        # 3. 调用插件的 chat 操作
        # 假设所有 Agent 插件都有一个 'chat' 操作
        # 这里需要实例化一个新的 PluginService，因为它需要 session
        # 注意：这里的 session 是当前请求的 session，可以直接复用
        service = PluginService(self.session)
        
        try:
            # 构造参数: 这里的参数名必须与目标插件方法的参数名一致
            # 假设标准接口为 chat(message: str, session_id: str)
            params = {"message": message, "session_id": session_id}
            
            # 调用插件操作
            result = await service.invoke_plugin_operation(
                plugin_id=plugin.id,
                operation_name="chat", # 约定操作名为 chat
                params=params,
                registry=registry
            )
            
            # 处理响应
            # 如果是异步生成器 (流式响应)，我们需要将其转换为生成器并 yield
            # invoke_plugin_operation 如果检测到生成器会直接返回生成器对象
            if inspect.isasyncgen(result):
                async for chunk in result:
                    yield chunk
                return

            # 如果是普通对象 (PluginOperationInvokeResponse)，提取 payload
            if hasattr(result, 'payload'):
                yield result.payload
                return
            
            # 其他情况直接返回
            yield result
            
        except Exception as e:
            # 记录错误并返回友好提示
            print(f"Error invoking agent plugin '{agent_name}': {e}")
            yield {"status": "error", "message": str(e)} 
        





