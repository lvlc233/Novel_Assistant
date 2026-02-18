"""
插件注册中心
负责插件的版本化注册和管理
"""
from __future__ import annotations
import hashlib
import json
import os
from typing import Any, Dict, List, Optional
from uuid import UUID

from dataclasses import dataclass
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.plugin.base.models import PluginDefinition
from infrastructure.pg.pg_models import PluginSQLEntity
from common.utils.utils import get_now_time
from common.enums import LoaderType
import importlib.util
import inspect
from pathlib import Path


@dataclass
class ValidationResult:
    """验证结果"""
    level: str  # ERROR, WARNING, INFO
    message: str
    plugin_id: str


class PluginDependencyError(Exception):
    """插件依赖错误"""
    pass



class PluginManager:
    """
    插件注册中心: 负责插件的版本化注册和运行时实例的管理
    插件的注册是指:
    1. 从数据库加载所有插件记录,并加载到内存注册表中: id+name+version=hash
    2. 对两个来源的插件进行去重,如果若存在id相同但是hash不同,则警告插件版本冲突,并迁移到冲突区的结构中
    3. 之后将插件的内存信息存储到数据库中,在进行以下的操作时: 1.第一次加载启动系统,2.关闭系统,3,更新插件配置,4.外部添加插件
   
    插件的实例管理:
    插件的实例管理是指:
    1. 加载插件的运行时配置和加载插件的运行时数据
    2. 生成插件的运行时访问端口:(这里需要思考使用url的方式还是内部服务的方式)
    3. 封装生成为插件的运行时,实例
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        # self._errors: List[str] = []
        self._plugins: Dict[UUID, PluginDefinition] = {}
    
    def _build_checksum(self, plugin_def: PluginDefinition) -> str:
        payload = {
            "name": plugin_def["name"],
            "version": plugin_def.get("version", "1.0.0"),
            "description": plugin_def.get("description"),
            "from_type": plugin_def["from_type"].value,
            "scope_type": plugin_def["scope_type"].value,
            "loader_type": plugin_def["loader_type"].value,
            "config_schema": plugin_def.get("config_schema", {}),
            "plugin_operation_schema": plugin_def.get("plugin_operation_schema", {}),
            "render_type": plugin_def["render_type"].value,
            "tags": plugin_def.get("tags", []),
        }
        raw = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    def _entity_to_definition(self, plugin: PluginSQLEntity) -> PluginDefinition:
        return PluginDefinition(
            id=plugin.id,
            name=plugin.name,
            version=plugin.version,
            description=plugin.description,
            from_type=plugin.from_type,
            scope_type=plugin.scope_type,
            loader_type=plugin.loader_type or LoaderType.INTERNAL,
            config_schema=plugin.runtime_config or {},
            plugin_operation_schema=plugin.plugin_operation_schema or {},
            render_type=plugin.render_type,
            tags=plugin.tags or [],
        )

    async def load_plugin(self) -> None:
        """load插件"""
        # 从数据库中搜索插件,并将其转化到_plugins中
        stmt = select(PluginSQLEntity)
        result = await self.session.execute(stmt)
        plugins = result.scalars().all()
        self._plugins = {plugin.id: self._entity_to_definition(plugin) for plugin in plugins}
        
    async def add_plugin_with_register(self, plugin_def: PluginDefinition) -> UUID|None:
        """添加插件并注册"""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_def["id"])
        result = await self.session.execute(stmt)
        plugin = result.scalar_one_or_none()
        checksum = self._build_checksum(plugin_def)

        if plugin is None:
            plugin = PluginSQLEntity(
                id=plugin_def["id"],
                name=plugin_def["name"],
                description=plugin_def.get("description"),
                from_type=plugin_def["from_type"],
                scope_type=plugin_def["scope_type"],
                enabled=True,
                version=plugin_def.get("version", "1.0.0"),
                checksum=checksum,
                loader_type=plugin_def["loader_type"],
                runtime_config=plugin_def.get("config_schema", {}),
                default_config={},
                plugin_operation_schema=plugin_def.get("plugin_operation_schema", {}),
                render_type=plugin_def["render_type"],
                tags=plugin_def.get("tags", []),
                update_at=get_now_time(),
            )
            self.session.add(plugin)
        else:
            plugin.name = plugin_def["name"]
            plugin.description = plugin_def.get("description")
            plugin.from_type = plugin_def["from_type"]
            plugin.scope_type = plugin_def["scope_type"]
            plugin.version = plugin_def.get("version", "1.0.0")
            plugin.checksum = checksum
            plugin.loader_type = plugin_def["loader_type"]
            plugin.runtime_config = plugin_def.get("config_schema", {})
            plugin.plugin_operation_schema = plugin_def.get("plugin_operation_schema", {})
            plugin.render_type = plugin_def["render_type"]
            plugin.tags = plugin_def.get("tags", [])
            plugin.update_at = get_now_time()

        await self.session.commit()
        await self.session.refresh(plugin)
        self._plugins[plugin.id] = self._entity_to_definition(plugin)
        plugin_id: UUID = plugin.id
        return plugin_id
        
    



class PluginDiscoveryError(Exception):
    """插件发现错误"""
    pass

class PluginInternalRegistry(BaseModel):
    """插件内部注册器

        我们再加一个概念,叫插件市场:一方面是为了扩展性考虑,另外一个方面是处理内部插件定义时的给出,
        通过插件扫描器,我们可以扫描通过新的注解(未定义)的插件,将内部的代码的插件暂在一个特殊的内存地址中,
        并可以选择性的进行插件的注册,从而实现插件的动态加载和管理。解决之前内部插件何时注册的问题
        简单来说: 我们现在有个类似于插件市场的概念(对外),我们扫描的插件会默认进入插件市场(也就是这个区域),
        而注册器呢,则专注于插件的数据库管理和序列化反序列化。从而职责分离。
    
    在插件管理器中,负责对系统的内部定义的插件进行扫描并注册到插件内部注册器中。
    """
    plugins: List[PluginDefinition] = []
    def get_plugin_list(self) -> List[PluginDefinition]:
        """根据ID获取插件定义"""
        return self.plugins
    
    def discover_plugins(self, plugins_dir: str) -> List[PluginDefinition]:
        """
        递归扫描插件目录，发现所有插件定义,并注册到插件内部注册器中
        
        Args:
            plugins_dir: 插件目录路径
        """
        plugins = []
        
        try:
            for item in os.scandir(plugins_dir):
                if item.is_dir():
                    # 检查是否存在 plugin.py
                    plugin_file = os.path.join(item.path, "plugin.py")
                    if os.path.exists(plugin_file):
                        # 解析插件定义
                        plugin_def = self._parse_plugin_file(plugin_file)
                        if plugin_def:
                            plugins.append(plugin_def)
                    
                    # 递归扫描子目录（子插件）
                    subplugins = self.discover_plugins(item.path)
                    plugins.extend(subplugins)
        except OSError as e:
            raise PluginDiscoveryError(f"无法扫描插件目录 {plugins_dir}: {e}")
        
        self.plugins.extend(plugins)
        return plugins


    def _parse_plugin_file(self, plugin_file_path: str) -> Optional[PluginDefinition]:
        """
        解析插件文件，提取插件定义
        
        Args:
            plugin_file_path: 插件文件路径
            
        Returns:
            插件定义字典，如果解析失败返回None
        """
        try:
            # 动态导入插件模块
  
            spec = importlib.util.spec_from_file_location(
                "plugin_module", 
                plugin_file_path
            )
            if spec is None or spec.loader is None:
                return None
                
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # 查找插件定义 - 支持新旧两种格式
            for name, obj in inspect.getmembers(module, inspect.isclass):
                # 排除内置类和系统类
                if (hasattr(obj, '__module__') and 
                    not obj.__module__.startswith('builtins') and
                    not obj.__module__.startswith('__')):
                    
                    plugin_def = self._extract_plugin_metadata(obj, plugin_file_path)
                    if plugin_def:
                        return plugin_def
            
            return None
            
        except Exception as e:
            print(f"解析插件文件 {plugin_file_path} 失败: {e}")
            return None


    def _extract_plugin_metadata(self, cls: type, plugin_file_path: str) -> Optional[PluginDefinition]:
        """
        从注解装饰的类中提取插件元数据
        """
        if hasattr(cls, "__plugin_wrapper__"):
            wrapper = getattr(cls, "__plugin_wrapper__")
            return wrapper.build_definition()
        
        return None
