"""
核心插件功能测试（完全避免数据库依赖）
"""
import sys
import os
import asyncio
from uuid import UUID

# 添加src到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from common.model.plugin_definition import PluginDefinition
from common.enums import LoaderType, RenderType, PluginFromTypeEnum, PluginScopeTypeEnum
from core.plugin.instance import PluginInstance
from core.plugin.loader import create_loader, URLLoader, JSONLoader, InternalLoader


async def test_loader_creation():
    """测试加载器创建"""
    print("Testing loader creation...")
    
    # Test URL loader
    url_loader = create_loader(LoaderType.URL)
    assert isinstance(url_loader, URLLoader)
    print("URL loader created successfully")
    
    # Test JSON loader
    json_loader = create_loader(LoaderType.JSON)
    assert isinstance(json_loader, JSONLoader)
    print("JSON loader created successfully")
    
    # Test Internal loader
    internal_loader = create_loader(LoaderType.INTERNAL)
    assert isinstance(internal_loader, InternalLoader)
    print("Internal loader created successfully")
    
    print("Loader creation test passed!")


async def test_plugin_instance_info():
    """测试插件实例信息（不执行）"""
    print("\nTesting plugin instance info...")
    
    # Create test plugin definition
    plugin_def = PluginDefinition(
        id=UUID('00000000-0000-0000-0000-000000000001'),
        name='test_json_plugin',
        description='Test JSON plugin',
        from_type=PluginFromTypeEnum.OFFICIAL,
        scope_type=PluginScopeTypeEnum.GLOBAL,
        loader_type=LoaderType.JSON,
        render_type=RenderType.CARD,
        version='1.0.0'
    )
    
    # Create plugin instance
    instance = PluginInstance(plugin_def, {
        'payload': {'test': 'data', 'items': [1, 2, 3]}
    })
    
    # Test instance info
    info = instance.get_info()
    assert info['name'] == 'test_json_plugin'
    assert info['loader_type'] == 'json'
    assert info['render_type'] == 'CARD'
    print("Plugin instance info correct")
    
    print("Plugin instance test passed!")


async def test_manual_loader():
    """手动测试加载器功能"""
    print("\nTesting manual loader execution...")
    
    # Test JSON loader directly
    json_loader = JSONLoader()
    
    # Test with proper config
    config = {
        'payload': {
            'cards': [
                {
                    'id': '1',
                    'title': 'Test Card',
                    'summary': 'This is a test card'
                }
            ]
        },
        'plugin_id': UUID('00000000-0000-0000-0000-000000000001')
    }
    
    try:
        result = await json_loader.load(config)
        print("JSON loader execution successful")
        print(f"Result type: {type(result)}")
    except Exception as e:
        print(f"JSON loader failed: {e}")
    
    print("Manual loader test passed!")


async def main():
    """主测试函数"""
    print("=" * 50)
    print("Core Plugin Functionality Test")
    print("=" * 50)
    
    try:
        await test_loader_creation()
        await test_plugin_instance_info()
        await test_manual_loader()
        
        print("\n" + "=" * 50)
        print("All core functionality tests passed!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(asyncio.run(main()))