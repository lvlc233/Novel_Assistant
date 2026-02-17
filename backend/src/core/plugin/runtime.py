"""
插件注册中心
负责插件的版本化注册和管理
"""
from __future__ import annotations
import hashlib
import json
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.src.core.plugin.base.models import PluginDefinition
from infrastructure.pg.pg_models import PluginSQLEntity
from common.utils.utils import get_now_time
from common.enums import LoaderType


class PluginRegistry:
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
        self._errors: List[str] = []
    
    def _calculate_checksum(self, plugin_def: PluginDefinition) -> str:
        """计算插件配置的MD5校验和"""
        # 序列化配置数据（排除id和version）
        config_data = {
            "runtime_config": plugin_def.runtime_config,
            "default_config": plugin_def.default_config,
            "plugin_operation_schema": plugin_def.plugin_operation_schema,
            "tags": plugin_def.tags
        }
        
        serialized = json.dumps(config_data, sort_keys=True)
        return hashlib.md5(serialized.encode()).hexdigest()
    
    async def _find_existing_plugin(self, plugin_id: UUID) -> Optional[PluginSQLEntity]:
        """查找已存在的插件"""
        stmt = select(PluginSQLEntity).where(PluginSQLEntity.id == plugin_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def _create_plugin(self, plugin_def: PluginDefinition, checksum: str) -> UUID:
        """创建新插件"""
        plugin = PluginSQLEntity(
            id=plugin_def.id,
            name=plugin_def.name,
            version=plugin_def.version,
            description=plugin_def.description,
            from_type=plugin_def.from_type,
            scope_type=plugin_def.scope_type,
            loader_type=plugin_def.loader_type,
            runtime_config=plugin_def.runtime_config,
            default_config=plugin_def.default_config,
            plugin_operation_schema=plugin_def.plugin_operation_schema,
            render_type=plugin_def.render_type,
            tags=plugin_def.tags,
            checksum=checksum
        )
        self.session.add(plugin)
        await self.session.commit()
        return plugin.id
    
    async def _update_plugin(self, existing: PluginSQLEntity, plugin_def: PluginDefinition, checksum: str) -> UUID:
        """更新现有插件配置（版本相同但配置变更）"""
        existing.runtime_config = plugin_def.runtime_config
        existing.default_config = plugin_def.default_config
        existing.plugin_operation_schema = plugin_def.plugin_operation_schema
        existing.tags = plugin_def.tags
        existing.checksum = checksum
        existing.update_at = get_now_time()
        await self.session.commit()
        return existing.id
    
    async def _overwrite_plugin(self, existing: PluginSQLEntity, plugin_def: PluginDefinition, checksum: str) -> UUID:
        """覆盖插件（版本不同）"""
        existing.name = plugin_def.name
        existing.version = plugin_def.version
        existing.description = plugin_def.description
        existing.from_type = plugin_def.from_type
        existing.scope_type = plugin_def.scope_type
        existing.loader_type = plugin_def.loader_type
        existing.runtime_config = plugin_def.runtime_config
        existing.default_config = plugin_def.default_config
        existing.plugin_operation_schema = plugin_def.plugin_operation_schema
        existing.render_type = plugin_def.render_type
        existing.tags = plugin_def.tags
        existing.checksum = checksum
        existing.update_at = get_now_time()
        await self.session.commit()
        return existing.id
    
    async def register(self, plugin_def: PluginDefinition) -> UUID:
        """
        注册插件到系统
        策略: id相同+版本相同 → 跳过 | id相同+版本不同 → 覆盖 | id不存在 → 新增
        """
        try:
            checksum = self._calculate_checksum(plugin_def)
            existing = await self._find_existing_plugin(plugin_def.id)
            
            if existing and existing.version == plugin_def.version:
                if existing.checksum == checksum:
                    # 完全相同的插件，跳过
                    return existing.id
                else:
                    # 版本相同但配置不同，更新
                    return await self._update_plugin(existing, plugin_def, checksum)
            elif existing:
                # 版本不同，覆盖
                return await self._overwrite_plugin(existing, plugin_def, checksum)
            else:
                # 新增插件
                return await self._create_plugin(plugin_def, checksum)
                
        except Exception as e:
            error_msg = f"Failed to register plugin {plugin_def.name}: {str(e)}"
            self._errors.append(error_msg)
            raise
    
    
    async def register_with_deterministic_id(self,
                                          source_namespace: str,
                                          plugin_name: str,
                                          loader_type: LoaderType,
                                          operation_builders: list,
                                          **kwargs) -> UUID:
        """使用确定性ID注册插件"""
        try:
            plugin_def = PluginDefinition.create_plugin(
                source_namespace=source_namespace,
                plugin_name=plugin_name,
                loader_type=loader_type,
                operation_builders=operation_builders,
                **kwargs
            )
            return await self.register(plugin_def)
            
        except Exception as e:
            error_msg = f"Failed to register plugin with deterministic ID {plugin_name}: {str(e)}"
            self._errors.append(error_msg)
            raise
    
    def get_errors(self) -> List[str]:
        """获取注册过程中的错误信息"""
        return self._errors.copy()
    
    def clear_errors(self):
        """清除错误信息"""
        self._errors.clear()


class PluginScanner:
    """插件扫描器
    我们再加一个概念,叫插件市场:一方面是为了扩展性考虑,另外一个方面是处理内部插件定义时的给出,
    通过插件扫描器,我们可以扫描通过新的注解(未定义)的插件,将内部的代码的插件暂在一个特殊的内存地址中,
    并可以选择性的进行插件的注册,从而实现插件的动态加载和管理。解决之前内部插件何时注册的问题
    简单来说: 我们现在有个类似于插件市场的概念(对外),我们扫描的插件会默认进入插件市场(也就是这个区域),
    而注册器呢,则专注于插件的数据库管理和序列化反序列化。从而职责分离。
    """
