"""
插件路由
2026.03.02更新:
移除了internal,system等旧设计中,遗留的实验性代码
"""

from typing import List, Any, Dict
from uuid import UUID
import inspect
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.dependencies import get_internal_plugin_registry
from api.routes.plugin.schema import (
    PluginResponse,
    PluginShopMetaResponse,
    PluginUpdateRequest,
    PluginOperation
)
from core.plugin.runtime import PluginInternalRegistry, PluginManager
from infrastructure.pg.pg_client import get_session
from infrastructure.pg.pg_models import PluginSQLEntity
from services.plugin.service import PluginService

router = APIRouter(prefix="/plugin", tags=["plugins"])

def get_plugin_service(session: AsyncSession = Depends(get_session)) -> PluginService:
    return PluginService(session)



"""
2026.03.02_human:优化逻辑
一个思考是,或许service的返回可以是dict或者typedDict
"""
@router.get("/shop", response_model=Response[List[PluginShopMetaResponse]])
async def get_shop_plugins(
    registry: PluginInternalRegistry = Depends(get_internal_plugin_registry),
    session: AsyncSession = Depends(get_session),
) -> Response[List[PluginShopMetaResponse]]:
    """
    获取商店插件列表.
    逻辑：从 Registry 获取定义，从 DB 获取安装状态，合并返回。
    """
    
    # 1. 获取注册表中的插件定义
    registry_plugins = registry.get_plugin_list()
    plugin_ids = [p["id"] for p in registry_plugins]
    
    # 2. 批量查询数据库状态 (仅当有插件 ID 时)
    installed_map = {}
    if plugin_ids:
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id.in_(plugin_ids))
        result = await session.execute(stmt)
        # 直接在生成字典时完成映射
        installed_map = {p.id: p for p in result.scalars()}

    # 3. 构造响应数据 (通过推导式合并)
    data = []
    for p_def in registry_plugins:
        pid = p_def["id"]
        db_plugin = installed_map.get(pid)
        
        # 提取版本信息
        latest_v = p_def.get("version", "1.0.0")
        inst_v = db_plugin.version if db_plugin else None
        
        data.append(
            PluginShopMetaResponse(
                id=pid,
                name=p_def["name"],
                # 当前版本
                version=inst_v or "1.0.0",
                latest_version=latest_v,
                description=p_def.get("description", ""),
                from_type=p_def["from_type"],
                installed=db_plugin is not None,
                operations=[
                    PluginOperation(
                        name=name,
                        description=op.get("description"),
                        input_schema=op.get("input_schema", {}),
                        output_schema=op.get("output_schema"),
                        with_ui=op.get("with_ui", []),
                        ui_target=op.get("ui_target"),
                        trigger=op.get("trigger"),
                        is_stream=op.get("is_stream", False)
                    )
                    for name, op in (p_def.get("plugin_operation_schema") or {}).get("operations", {}).items()
                ]
            )
        )
    return Response.ok(data=data)

@router.post("/shop/{plugin_id}/register", response_model=Response[UUID])
async def register_shop_plugin(
    plugin_id: UUID,
    registry: PluginInternalRegistry = Depends(get_internal_plugin_registry),
    session: AsyncSession = Depends(get_session),
) -> Response[UUID]:
    """
    这个接口是将shop中的插件更新到数据库中,也就是将内存中的插件更新到数据库中.
    """
    # 从内存中获取数据
    plugin_def = next(
        (item for item in registry.get_plugin_list() if item["id"] == plugin_id),
        None,
    )
    if plugin_def is None:
        return Response.fail(code=40400, message=f"插件不存在: {plugin_id}")
    # 使用管理器注册到系统中(也就是数据库中)
    """
    但是现在这个写法不是当初当成servcie吗?而且要频繁的创建...这里以后要思考,我们现在系统中有三个插件的地方了,先不管了,影响不大
    """
    manager = PluginManager(session)
    registered_id = await manager.add_plugin_with_register(plugin_def)
    return Response.ok(data=registered_id)

@router.post("/shop/{plugin_id}/unregister", response_model=Response[UUID])
async def unregister_shop_plugin(
    plugin_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> Response[UUID]:
    """
    这个接口是将shop中的插件从数据库中移除.
    """
    manager = PluginManager(session)
    removed = await manager.remove_plugin(plugin_id)
    if not removed:
        return Response.fail(code=40400, message=f"插件不存在: {plugin_id}")
    return Response.ok(data=plugin_id)

@router.get("/{plugin_id}", response_model=Response[PluginResponse])
async def get_plugin_detail(
    plugin_id: UUID,
    service: PluginService = Depends(get_plugin_service)
) -> Response[PluginResponse]:
    """获取插件详情."""
    data = await service.get_plugin_detail(plugin_id)
    return Response.ok(data=data)

@router.patch("/{plugin_id}", response_model=Response[None])
async def update_plugin(
    plugin_id: UUID,
    request: PluginUpdateRequest,
    service: PluginService = Depends(get_plugin_service)
) -> Response[None]:
    """更新插件配置."""
    await service.update_plugin(plugin_id, request)
    return Response.ok()



"""
2026.03.04_human:
新增代理接口
"""

@router.post("/refresh", response_model=Response[List[PluginShopMetaResponse]])
async def refresh_plugins(
    registry: PluginInternalRegistry = Depends(get_internal_plugin_registry),
    session: AsyncSession = Depends(get_session),
) -> Response[List[PluginShopMetaResponse]]:
    """
    手动刷新内部插件列表
    """
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    plugins_dir = os.path.join(base_dir, "plugin")
    
    # 重新扫描
    registry.discover_plugins(plugins_dir)
    
    # 自动注册新发现的插件
    manager = PluginManager(session)
    for plugin_def in registry.get_plugin_list():
        await manager.add_plugin_with_register(plugin_def)
    
    # 返回最新列表（复用 get_shop_plugins 逻辑）
    return await get_shop_plugins(registry, session)
@router.post("/proxy/{plugin_id}/{operation_name}", response_model=Any)
async def proxy_plugin_operation(
    plugin_id: UUID,
    operation_name: str,
    body: Dict[str, Any],
    service: PluginService = Depends(get_plugin_service),
    registry: PluginInternalRegistry = Depends(get_internal_plugin_registry),
) -> Any:
    """
    代理插件操作调用接口
    """
    try:
        # 参数处理
        params = body.get("params", body)
        # runtime_config = body.get("config", None) # 2026.03.06: 移除从body获取config, 改为完全由Service层从数据库加载配置
        
        result = await service.invoke_plugin_operation(
            plugin_id=plugin_id,
            operation_name=operation_name,
            params=params,
            # runtime_config=None, # 不再接受外部传入的临时配置
            registry=registry
        )
        
        # 自动判断是否为流式响应
        if inspect.isasyncgen(result):
            async def generator_wrapper():
                async for chunk in result:
                    # 确保 chunk 是 JSON 字符串
                    if isinstance(chunk, (dict, list)):
                        yield json.dumps(chunk, ensure_ascii=False) + "\n"
                    else:
                        yield str(chunk) + "\n"
            
            return StreamingResponse(generator_wrapper(), media_type="application/x-ndjson")
            
        return Response.ok(data=result)
    except Exception as e:
        return Response.fail(code=500, message=str(e))

