"""
插件集成测试（不依赖数据库）
"""
import sys
import os
import asyncio
from uuid import UUID

# 添加src到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from core.plugin.manager import PluginManager
from common.model.plugin_definition import PluginDefinition
from common.enums import LoaderType, RenderType, PluginFromTypeEnum, PluginScopeTypeEnum


async def test_plugin_manager():
    """测试插件管理器基础功能"""
    print("🧪 测试插件管理器...")
    
    manager = PluginManager()
    
    # 创建测试插件定义
    plugin_def = PluginDefinition(
        id=UUID('00000000-0000-0000-0000-000000000001'),
        name='test_url_plugin',
        description='测试URL插件',
        from_type=PluginFromTypeEnum.OFFICIAL,
        scope_type=PluginScopeTypeEnum.GLOBAL,
        loader_type=LoaderType.URL,
        render_type=RenderType.CARD,
        version='1.0.0'
    )
    
    # 手动添加到定义缓存（模拟数据库加载）
    manager.definitions[plugin_def.id] = plugin_def
    
    # 测试获取实例（懒加载）
    instance = await manager.get_instance(plugin_def.id)
    assert instance is not None
    print("✅ 插件实例懒加载成功")
    
    # 测试实例信息
    info = instance.get_info()
    assert info['name'] == 'test_url_plugin'
    assert info['loader_type'] == 'url'
    print("✅ 插件实例信息正确")
    
    print("🎉 插件管理器测试通过!")


async def test_plugin_execution():
    """测试插件执行功能"""
    print("\n🧪 测试插件执行...")
    
    from core.plugin.instance import PluginInstance
    from api.routes.plugin.schema import StandardDataResponse
    
    # 创建测试插件
    plugin_def = PluginDefinition(
        id=UUID('00000000-0000-0000-0000-000000000002'),
        name='test_json_plugin',
        from_type=PluginFromTypeEnum.OFFICIAL,
        scope_type=PluginScopeTypeEnum.GLOBAL,
        loader_type=LoaderType.JSON,
        render_type=RenderType.CARD
    )
    
    # 创建实例
    instance = PluginInstance(plugin_def, {
        'payload': {'test': 'data', 'items': [1, 2, 3]}
    })
    
    # 执行插件
    result = await instance.execute({})
    
    assert isinstance(result, StandardDataResponse)
    assert result.plugin_id == plugin_def.id
    assert result.render_type == RenderType.CARD
    print("✅ 插件执行返回StandardDataResponse格式")
    
    print("🎉 插件执行测试通过!")


async def main():
    """主测试函数"""
    print("=" * 50)
    print("🤖 插件系统集成测试")
    print("=" * 50)
    
    try:
        await test_plugin_manager()
        await test_plugin_execution()
        
        print("\n" + "=" * 50)
        print("🎯 所有测试通过! 插件系统集成成功")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())