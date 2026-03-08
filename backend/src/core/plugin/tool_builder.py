"""
插件工具化构建器
将 tags 含 "tool" 的插件的 @operation 自动转为 LangChain StructuredTool,
通过 AgentManager 的 per-Agent 配置控制开关。
"""
from __future__ import annotations

import inspect
from typing import Any, Dict, List, Optional, Type
from uuid import UUID

from langchain_core.tools import BaseTool, StructuredTool
from pydantic import BaseModel, Field, create_model
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.plugin.runtime import PluginInternalRegistry
from infrastructure.pg.pg_models import AgentsManagerSQLEntity


def _build_args_model(op_name: str, input_schema: Dict[str, Any]) -> Type[BaseModel]:
    """
    从 operation 的 input_schema 动态生成 Pydantic Model 作为工具的 args_schema。

    只保留 source == "input" 的参数（或没有 source 字段的参数），
    过滤掉 CONTEXT / PROPS 类型的参数（这些由前端/运行时注入，不应让 Agent 填写）。
    """
    fields: Dict[str, Any] = {}

    for param_name, param_info in input_schema.items():
        # 过滤非用户输入参数
        source = param_info.get("source", "input")
        if source != "input":
            continue

        # 映射 JSON schema 类型到 Python 类型
        json_type = param_info.get("type", "string")
        python_type = _json_type_to_python(json_type)

        required = param_info.get("required", False)
        default = param_info.get("default")

        if required:
            fields[param_name] = (python_type, Field(description=f"参数: {param_name}"))
        else:
            fields[param_name] = (
                Optional[python_type],
                Field(default=default, description=f"参数: {param_name}"),
            )

    if not fields:
        # 无参数操作，创建空模型
        fields["placeholder"] = (Optional[str], Field(default=None, exclude=True))

    model_name = f"ToolArgs_{op_name}"
    return create_model(model_name, **fields)


def _json_type_to_python(json_type: str) -> type:
    """JSON schema 类型映射到 Python 类型"""
    mapping = {
        "string": str,
        "integer": int,
        "number": float,
        "boolean": bool,
        "array": list,
        "object": dict,
        "any": str,  # fallback
    }
    return mapping.get(json_type, str)


async def _get_agent_tool_config(
    session: AsyncSession, agent_name: str
) -> Dict[str, Any]:
    """从 AgentsManagerSQLEntity 读取指定 Agent 的工具开关配置"""
    stmt = select(AgentsManagerSQLEntity).where(
        AgentsManagerSQLEntity.name == agent_name
    )
    result = await session.execute(stmt)
    agent = result.scalar_one_or_none()
    if not agent:
        return {}
    return (agent.config or {}).get("tools", {})


async def build_tools_from_plugins(
    registry: PluginInternalRegistry,
    session: AsyncSession,
    agent_name: str,
) -> List[BaseTool]:
    """
    将 tags 含 "tool" 的插件的启用操作转为 LangChain Tool 列表。

    Args:
        registry: 插件内部注册器（内存中的插件定义和 wrapper）
        session: 数据库会话（用于读取 Agent 配置 + 调用插件操作）
        agent_name: Agent 名称（用于读取 per-Agent 工具开关配置）

    Returns:
        可直接传给 model.bind_tools() 的 LangChain Tool 列表
    """
    # 1. 过滤 tool 标签插件
    tool_plugins = [
        p for p in registry.get_plugin_list()
        if "tool" in (p.get("tags") or [])
    ]

    if not tool_plugins:
        return []

    # 2. 读取 Agent 的工具开关配置
    tool_config = await _get_agent_tool_config(session, agent_name)

    # 3. 构建工具
    tools: List[BaseTool] = []

    for plugin_def in tool_plugins:
        plugin_id: UUID = plugin_def["id"]
        plugin_name: str = plugin_def["name"]

        wrapper = registry.get_plugin_wrapper(plugin_id)
        if wrapper is None:
            continue

        # 获取该插件下 Agent 的开关配置
        plugin_tool_cfg = tool_config.get(plugin_name, {})

        for op_name, op_info in wrapper.operations.items():
            # 检查该操作是否启用为工具（默认 True）
            is_tool_key = f"{op_name}_is_tool"
            if not plugin_tool_cfg.get(is_tool_key, True):
                continue

            # 构建 args_schema
            input_schema = op_info.input_schema or {}
            args_model = _build_args_model(op_name, input_schema)

            # 构建工具名称（加插件前缀避免冲突）
            tool_name = f"{plugin_name}_{op_name}"
            tool_description = op_info.description or f"{plugin_name} 的 {op_name} 操作"

            # 捕获闭包变量
            _plugin_id = plugin_id
            _op_name = op_name
            _registry = registry

            async def _invoke_tool(
                _pid=_plugin_id,
                _on=_op_name,
                _reg=_registry,
                **kwargs,
            ) -> Any:
                """通过 PluginService 调用插件操作"""
                # 延迟导入避免循环依赖
                from services.plugin.service import PluginService

                service = PluginService(session)
                result = await service.invoke_plugin_operation(
                    plugin_id=_pid,
                    operation_name=_on,
                    params=kwargs,
                    registry=_reg,
                )
                # 如果是 PluginOperationInvokeResponse，提取 payload
                if hasattr(result, "payload"):
                    return result.payload
                return result

            tool = StructuredTool.from_function(
                coroutine=_invoke_tool,
                name=tool_name,
                description=tool_description,
                args_schema=args_model,
            )
            tools.append(tool)

    return tools
