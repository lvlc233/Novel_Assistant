from typing import List, Dict, Any
import inspect
from uuid import uuid4
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
    
    # 邮箱配置已被废弃，改用工具映射管理
    # async def _get_email_config(self) -> Dict[str, bool]:
    #     """获取AgentManager的邮件配置 (agent_name -> enabled)"""
    #     return {}

    # async def _save_email_config(self, config: Dict[str, bool]):
    #     """保存AgentManager的邮件配置"""
    #     pass  # 已废弃

    async def _sync_agents_from_plugins(self):
        """同步插件中的Agent到Agent管理器"""
        print("[AgentManager] 正在从插件同步 Agent...")
        # 1. 获取所有带有 'agent' 标签的插件
        stmt_plugins = select(PluginSQLEntity)
        result_plugins = await self.session.execute(stmt_plugins)
        all_plugins = result_plugins.scalars().all()
        
        agent_plugins = []
        for p in all_plugins:
            if p.tags and isinstance(p.tags, list) and "agent" in p.tags:
                agent_plugins.append(p)
                
        print(f"[AgentManager] 发现 {len(agent_plugins)} 个带有 'agent' 标签的插件")
        
        # 2. 获取现有的 AgentManager 实体
        stmt_agents = select(AgentsManagerSQLEntity)
        result_agents = await self.session.execute(stmt_agents)
        existing_agents = result_agents.scalars().all()
        seen_agent_names = set()
        duplicated_agents = []
        for agent in existing_agents:
            if agent.name in seen_agent_names:
                duplicated_agents.append(agent)
            else:
                seen_agent_names.add(agent.name)
        if duplicated_agents:
            for duplicated in duplicated_agents:
                await self.session.delete(duplicated)
            await self.session.commit()
            existing_agents = [a for a in existing_agents if a not in duplicated_agents]
            print(f"[AgentManager] 已清理 {len(duplicated_agents)} 条重复 Agent 记录")
        existing_agent_names = {a.name for a in existing_agents}
        
        # 3. 注册新 Agent
        new_agents = []
        for plugin in agent_plugins:
            if plugin.name not in existing_agent_names:
                print(f"[AgentManager] 正在注册新 Agent: {plugin.name}")
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
            print(f"[AgentManager] 已注册 {len(new_agents)} 个新 Agent")
        
        # 4. 清理不再存在的 Agent
        valid_agent_plugin_names = {p.name for p in agent_plugins}
        agents_to_remove = []
        for agent in existing_agents:
            if agent.name not in valid_agent_plugin_names:
                print(f"[AgentManager] Agent '{agent.name}' 不再是有效的 Agent 插件，正在移除...")
                await self.session.delete(agent)
                agents_to_remove.append(agent.name)
        
        if agents_to_remove:
            await self.session.commit()
            print(f"[AgentManager] 已移除 {len(agents_to_remove)} 个无效 Agent: {agents_to_remove}")
        else:
             print("[AgentManager] 没有需要移除的 Agent")

    async def _get_agent_entity(self, agent_name: str) -> AgentsManagerSQLEntity | None:
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.name == agent_name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def _ensure_agent_session(self, agent_name: str, session_id: str) -> None:
        agent = await self._get_agent_entity(agent_name)
        if not agent:
            return
        sessions = list(agent.sessions or [])
        if session_id not in sessions:
            sessions.append(session_id)
            agent.sessions = sessions
        config = dict(agent.config or {})
        config["current_session_id"] = session_id
        agent.config = config
        await self.session.commit()
    
    async def _get_tool_config(self, agent_name: str) -> Dict[str, Any]:
        """获取指定 Agent 的工具映射配置，返回 dict，若不存在返回空 dict。"""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.name == agent_name)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            return {}
        return (agent.config or {}).get("tools", {})

    async def _save_tool_config(self, agent_name: str, tool_cfg: Dict[str, Any]) -> None:
        """保存指定 Agent 的工具映射配置。"""
        stmt = select(AgentsManagerSQLEntity).where(AgentsManagerSQLEntity.name == agent_name)
        result = await self.session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            # 若不存在则创建一个新的 Agent 记录
            agent = AgentsManagerSQLEntity(name=agent_name, config={})
            self.session.add(agent)
            await self.session.flush()
        config = dict(agent.config or {})
        config["tools"] = tool_cfg
        agent.config = config
        await self.session.commit()

    async def _try_delegate_session_operation(self, agent_name: str, operation_name: str, params: Dict[str, Any]):
        plugin_stmt = select(PluginSQLEntity).where(PluginSQLEntity.name == agent_name)
        plugin_result = await self.session.execute(plugin_stmt)
        plugin = plugin_result.scalar_one_or_none()
        if not plugin:
            return None
        operations = ((plugin.plugin_operation_schema or {}).get("operations") or {})
        if operation_name not in operations:
            return None
        operation_schema = operations.get(operation_name) or {}
        input_schema = operation_schema.get("input_schema") or {}
        filtered_params = params
        if isinstance(input_schema, dict) and input_schema:
            filtered_params = {
                key: value
                for key, value in params.items()
                if key in input_schema
            }
        registry = PluginInternalRegistry.get_global()
        if not registry:
            return None
        service = PluginService(self.session)
        result = await service.invoke_plugin_operation(
            plugin_id=plugin.id,
            operation_name=operation_name,
            params=filtered_params,
            registry=registry
        )
        if hasattr(result, "payload"):
            return result.payload
        return result

    def _normalize_proxy_stream_event(self, chunk: Any) -> Dict[str, Any]:
        if isinstance(chunk, str):
            return {"event_type": "assistant_chunk", "content": chunk}
        if not isinstance(chunk, dict):
            return {"event_type": "raw", "data": chunk}
        if chunk.get("status") == "error":
            return {
                "event_type": "error",
                "message": chunk.get("message", "unknown error"),
                "raw": chunk
            }
        chunk_type = str(chunk.get("event_type") or chunk.get("type") or "").lower()
        if chunk_type in {"tool_call", "tool_dispatch"}:
            return {
                "event_type": "tool_dispatch",
                "tool_name": chunk.get("tool_name") or chunk.get("name"),
                "args": chunk.get("args"),
                "message": chunk.get("message"),
                "raw": chunk
            }
        if chunk_type in {"tool_result", "tool_message"}:
            return {
                "event_type": "tool_result",
                "tool_name": chunk.get("tool_name") or chunk.get("name"),
                "content": chunk.get("content") or chunk.get("message"),
                "raw": chunk
            }
        if chunk_type in {"hitl_interrupt", "interrupt"}:
            return {"event_type": "hitl_interrupt", "payload": chunk}
        if chunk_type in {"hitl_resume", "resumed"}:
            return {"event_type": "hitl_resumed", "payload": chunk}
        if isinstance(chunk.get("content"), str):
            return {"event_type": "assistant_chunk", "content": chunk.get("content"), "raw": chunk}
        return {"event_type": "raw", "data": chunk}

    @operation(
        name="get_agent_info",
        description="获取Agent信息,用于在邮箱侧边栏显示",
        with_ui=[Home.EmailBoot.filter()],
        ui_target=Home.EmailBox.AgentBox,
        trigger = UITrigger.CLICK
    )
    async def get_agent_info(self):
        """获取Agent信息"""
        print("[AgentManager] get_agent_info 被调用")
        try:
            # 0. 同步 Agent
            await self._sync_agents_from_plugins()

            # 1. 获取所有注册的Agent
            stmt = select(AgentsManagerSQLEntity)
            result = await self.session.execute(stmt)
            agents = result.scalars().all()
            print(f"[AgentManager] 数据库中发现 {len(agents)} 个 Agent")
            
            # 2. 不再获取邮件配置，保留空字典占位
            email_config = {}
            
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
                            checkpoint_payload = None
                            if isinstance(checkpoint_tuple, dict):
                                checkpoint_payload = checkpoint_tuple.get("checkpoint", checkpoint_tuple)
                            elif checkpoint_tuple and hasattr(checkpoint_tuple, "checkpoint"):
                                checkpoint_payload = checkpoint_tuple.checkpoint
                            
                            if isinstance(checkpoint_payload, dict):
                                channel_values = checkpoint_payload.get("channel_values", {})
                                raw_messages = channel_values.get("messages", []) if isinstance(channel_values, dict) else []
                                messages = [
                                    {
                                        "type": (m.get("type", "unknown") if isinstance(m, dict) else getattr(m, "type", "unknown")),
                                        "content": (m.get("content", "") if isinstance(m, dict) else getattr(m, "content", str(m)))
                                    }
                                    for m in raw_messages
                                ]
                            history_items.append({
                                "agent_name": agent.name,
                                "session_id": session_id,
                                "messages": messages
                            })
                    
                    agent_list.append({
                        "agent_name": agent.name,
                        "on_email": email_config.get(agent.name, False), # 保持字段兼容，默认 False
                        "history": history_items,
                        "current_session_id": (agent.config or {}).get("current_session_id")
                    })

            # 3. 封装为 List[AgentMessageHistoryItem]的字典并返回
            print(f"[AgentManager] 返回 {len(agent_list)} 个 Agent 信息")
            return agent_list
        except Exception as e:
            print(f"[AgentManager] get_agent_info 出错: {e}")
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
        """获取Agent基础列表，在工具管理卡片中展示"""
        print("[AgentManager] get_agent_info_in_card 被调用")
        stmt = select(AgentsManagerSQLEntity)
        result = await self.session.execute(stmt)
        agents = result.scalars().all()
        
        agent_list = []
        for agent in agents:
            agent_list.append({
                "agent_name": agent.name,
                "description": agent.description
            })
            
        return {
            "name": "agent_manager",
            "data": {"agents": agent_list},
            "info_type": "Info"
        }
    

    
    @operation(
        name="get_agent_tool_info",
        description="获取所有 Agent 及其工具映射配置",
        with_ui=[Home.PluginExpand.PluginCard.filter(name="agent_manager")],
        ui_target=Home.PluginDetails.Info,
        trigger=UITrigger.CLICK
    )
    async def get_agent_tool_info(self):
        """返回所有 Agent 的工具配置（不含历史）"""
        stmt = select(AgentsManagerSQLEntity)
        result = await self.session.execute(stmt)
        agents = result.scalars().all()
        agent_list = []
        for agent in agents:
            tools_cfg = (agent.config or {}).get("tools", {})
            agent_list.append({
                "agent_name": agent.name,
                "description": agent.description,
                "tools": tools_cfg,
                "enabled": agent.enabled,
                "broadcast": agent.broadcast,
                "context_size": agent.context_size,
                "is_summary": agent.is_summary,
                "sessions": agent.sessions,
                "config": agent.config or {}
            })
        return agent_list

    # 已废弃的邮箱状态操作，改为工具映射管理
    # @operation(
    #     name="update_agent_email_state",
    #     description="更新插件中的Agent邮件状态(是否开启)",
    #     with_ui=[Home.PluginDetails.Info.filter(name="agent_manager")],
    #     trigger = UITrigger.CLICK
    # )
    # async def update_agent_email_state(self, agent_name: str, on_email: bool):
    #     pass

    @operation(
        name="list_agent_plugins",
        description="列出指定 Agent 可用的工具插件及其操作开关状态",
        trigger=UITrigger.CLICK
    )
    async def list_agent_plugins(self, agent_name: str):
        """返回该 Agent 可用的工具插件列表及每个 operation 的 enabled 状态"""
        registry = PluginInternalRegistry.get_global()
        if not registry:
            return []
        # 所有工具插件
        plugins = [p for p in registry.get_plugin_list() if "tool" in p.get("tags", [])]
        # 当前 Agent 的工具配置
        tool_cfg = await self._get_tool_config(agent_name)
        result = []
        for plug in plugins:
            plugin_name = plug["name"]
            wrapper = registry.get_plugin_wrapper(plug["id"])
            ops = []
            for op_name, op_info in wrapper.operations.items():
                key = f"{op_name}_is_tool"
                enabled = tool_cfg.get(plugin_name, {}).get(key, True)
                ops.append({
                    "name": op_name,
                    "description": op_info.description,
                    "enabled": enabled
                })
            result.append({
                "plugin_name": plugin_name,
                "operations": ops
            })
        return result

    @operation(
        name="update_agent_tool_state",
        description="更新指定 Agent 对某插件某工具的开关状态",
        trigger=UITrigger.CLICK
    )
    async def update_agent_tool_state(self, agent_name: str, plugin_name: str, tool_name: str, enabled: bool):
        """修改工具开关并持久化"""
        tool_cfg = await self._get_tool_config(agent_name)
        plugin_cfg = tool_cfg.get(plugin_name, {})
        plugin_cfg[f"{tool_name}_is_tool"] = enabled
        tool_cfg[plugin_name] = plugin_cfg
        await self._save_tool_config(agent_name, tool_cfg)
        return {"success": True, "agent_name": agent_name, "plugin_name": plugin_name, "tool_name": tool_name, "enabled": enabled}

    @operation(
        name="list_agent_sessions",
        description="列出指定Agent会话",
        trigger = UITrigger.CLICK
    )
    async def list_agent_sessions(self, agent_name: str):
        delegated = await self._try_delegate_session_operation(agent_name, "list_sessions", {"agent_name": agent_name})
        if delegated is not None:
            return delegated
        agent = await self._get_agent_entity(agent_name)
        if not agent:
            return {"agent_name": agent_name, "sessions": [], "current_session_id": None}
        sessions = list(agent.sessions or [])
        return {
            "agent_name": agent_name,
            "sessions": sessions,
            "current_session_id": (agent.config or {}).get("current_session_id")
        }

    @operation(
        name="create_agent_session",
        description="创建指定Agent会话",
        trigger = UITrigger.CLICK
    )
    async def create_agent_session(self, agent_name: str, session_id: str | None = None):
        delegated = await self._try_delegate_session_operation(
            agent_name,
            "create_session",
            {"agent_name": agent_name, "session_id": session_id}
        )
        if delegated is not None:
            return delegated
        new_session_id = session_id or f"{agent_name}-{uuid4()}"
        await self._ensure_agent_session(agent_name, new_session_id)
        return {"agent_name": agent_name, "session_id": new_session_id}

    @operation(
        name="switch_agent_session",
        description="切换指定Agent会话",
        trigger = UITrigger.CLICK
    )
    async def switch_agent_session(self, agent_name: str, session_id: str):
        delegated = await self._try_delegate_session_operation(
            agent_name,
            "switch_session",
            {"agent_name": agent_name, "session_id": session_id}
        )
        if delegated is not None:
            return delegated
        await self._ensure_agent_session(agent_name, session_id)
        return {"agent_name": agent_name, "session_id": session_id}

    @operation(
        name="delete_agent_session",
        description="删除指定Agent会话",
        trigger = UITrigger.CLICK
    )
    async def delete_agent_session(self, agent_name: str, session_id: str):
        delegated = await self._try_delegate_session_operation(
            agent_name,
            "delete_session",
            {"agent_name": agent_name, "session_id": session_id}
        )
        if delegated is not None:
            return delegated
        agent = await self._get_agent_entity(agent_name)
        if not agent:
            return {"agent_name": agent_name, "deleted": False}
        sessions = [sid for sid in (agent.sessions or []) if sid != session_id]
        agent.sessions = sessions
        config = dict(agent.config or {})
        if config.get("current_session_id") == session_id:
            config["current_session_id"] = sessions[-1] if sessions else None
        agent.config = config
        await self.session.commit()
        return {"agent_name": agent_name, "deleted": True, "session_id": session_id}

    @operation(
        name="proxy_send_agent_message",
        description="代理发送Agent消息",
        with_ui=[Home.EmailBox.AgentBox.filter()],
        trigger = UITrigger.ENTER
    )
    async def proxy_send_agent_message(
        self,
        agent_name: str,
        message: str,
        session_id: str,
        work_id: str | None = None,
        document_id: str | None = None,
        version_id: str | None = None,
        document_content: str | None = None,
        document_title: str | None = None,
    ):
        # 1. 查找目标插件
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
        service = PluginService(self.session)
        
        try:
            await self._ensure_agent_session(agent_name, session_id)
            ops = ((plugin.plugin_operation_schema or {}).get("operations") or {})
            chat_op = ops.get("chat") or {}
            input_schema = chat_op.get("input_schema") or {}

            params = {"message": message}
            if isinstance(input_schema, dict) and input_schema:
                candidate_params = {
                    "message": message,
                    "query": message,
                    "session_id": session_id,
                    "thread_id": session_id,
                    "page_id": session_id,
                    "work_id": work_id,
                    "document_id": document_id,
                    "version_id": version_id,
                    "document_content": document_content,
                    "document_title": document_title,
                }
                params = {
                    key: value
                    for key, value in candidate_params.items()
                    if key in input_schema
                } or {"message": message}
            
            result = await service.invoke_plugin_operation(
                plugin_id=plugin.id,
                operation_name="chat", # 约定操作名为 chat
                params=params,
                registry=registry
            )
            
            if inspect.isasyncgen(result):
                yield {"event_type": "assistant_start", "session_id": session_id, "agent_name": agent_name}
                async for chunk in result:
                    yield self._normalize_proxy_stream_event(chunk)
                yield {"event_type": "assistant_end", "session_id": session_id, "agent_name": agent_name}
                return

            if hasattr(result, 'payload'):
                yield self._normalize_proxy_stream_event(result.payload)
                return
            
            yield self._normalize_proxy_stream_event(result)
            
        except Exception as e:
            print(f"[AgentManager] 调用 Agent 插件 '{agent_name}' 失败: {e}")
            import traceback
            traceback.print_exc()
            if "'NoneType' object has no attribute 'get'" in str(e):
                yield {"status": "error", "message": f"Agent '{agent_name}' 内部错误: 可能是运行时上下文未注入或配置缺失。"}
            else:
                yield {"status": "error", "message": str(e)} 

    @operation(
        name="proxy_resume_agent_review",
        description="代理恢复Agent人工审核",
        with_ui=[Home.EmailBox.AgentBox.filter()],
        trigger=UITrigger.CLICK
    )
    async def proxy_resume_agent_review(
        self,
        agent_name: str,
        session_id: str,
        decision: str,
        edited_action: Dict[str, Any] | None = None,
        work_id: str | None = None,
        document_id: str | None = None,
        version_id: str | None = None,
        document_content: str | None = None,
        document_title: str | None = None,
    ):
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.name == agent_name)
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        if not plugin:
            yield {"status": "error", "message": f"Agent plugin '{agent_name}' not found"}
            return
        registry = PluginInternalRegistry.get_global()
        if not registry:
            yield {"status": "error", "message": "Plugin registry not initialized"}
            return
        service = PluginService(self.session)
        try:
            payload = {
                "session_id": session_id,
                "decision": decision,
                "edited_action": edited_action,
                "work_id": work_id,
                "document_id": document_id,
                "version_id": version_id,
                "document_content": document_content,
                "document_title": document_title,
            }
            invoke_result = await service.invoke_plugin_operation(
                plugin_id=plugin.id,
                operation_name="resume_human_review",
                params=payload,
                registry=registry
            )
            if inspect.isasyncgen(invoke_result):
                yield {"event_type": "assistant_start", "session_id": session_id, "agent_name": agent_name}
                async for chunk in invoke_result:
                    yield self._normalize_proxy_stream_event(chunk)
                yield {"event_type": "assistant_end", "session_id": session_id, "agent_name": agent_name}
                return
            if hasattr(invoke_result, "payload"):
                yield self._normalize_proxy_stream_event(invoke_result.payload)
                return
            yield self._normalize_proxy_stream_event(invoke_result)
        except Exception as e:
            yield {"status": "error", "message": str(e)}
        
