"""
测试插件操作装饰器功能
"""
import sys
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

# 添加src到路径
sys.path.append('src')

def test_decorator():
    """测试装饰器功能"""
    print("=== 测试装饰器功能 ===")
    
    from services.memory.service import MemoryService
    
    # 创建服务实例
    service = MemoryService(session=None)
    method = service.get_memory_list
    
    # 检查装饰器
    if hasattr(method, '__plugin_operation__'):
        config = method.__plugin_operation__
        print("装饰器配置找到:")
        print(f"  插件ID: {config['plugin_id']}")
        print(f"  操作名: {config['operation_name']}")
        print(f"  响应模型: {config['response_model']}")
        return True
    else:
        print("未找到装饰器配置")
        return False

def test_registry():
    """测试注册表功能"""
    print("\n=== 测试注册表功能 ===")
    
    from core.plugin.operation_registry import PluginOperationRegistry
    from services.memory.service import MemoryService
    
    # 清空注册表
    PluginOperationRegistry.clear()
    
    # 手动注册操作
    service = MemoryService(session=None)
    method = service.get_memory_list
    
    PluginOperationRegistry.register(
        '00000000-0000-0000-0000-000000000002',
        'get_memory_list',
        method
    )
    
    # 检查注册
    operations = PluginOperationRegistry.get_all_operations()
    print(f"注册的操作数量: {len(operations)}")
    
    for op_key in operations:
        print(f"  操作键: {op_key}")
    
    return len(operations) > 0

async def test_scanner():
    """测试扫描器功能"""
    print("\n=== 测试扫描器功能 ===")
    
    from core.plugin.operation_scanner import scan_and_register_operations
    from core.plugin.operation_registry import PluginOperationRegistry
    from services.memory.service import MemoryService
    
    # 清空注册表
    PluginOperationRegistry.clear()
    
    # 测试扫描
    service_classes = [MemoryService]
    session = None  # 模拟session
    
    await scan_and_register_operations(service_classes, session)
    
    operations = PluginOperationRegistry.get_all_operations()
    print(f"扫描到的操作数量: {len(operations)}")
    
    for op_key in operations:
        print(f"  操作键: {op_key}")
    
    return len(operations) > 0

async def main():
    """主测试函数"""
    print("开始测试插件操作装饰器功能...\n")
    
    # 运行所有测试
    tests = [
        test_decorator(),
        test_registry(),
        await test_scanner()
    ]
    
    # 汇总结果
    success_count = sum(1 for result in tests if result)
    total_count = len(tests)
    
    print(f"\n=== 测试结果 ===")
    print(f"通过测试: {success_count}/{total_count}")
    
    if success_count == total_count:
        print("所有测试通过！")
        return True
    else:
        print("部分测试失败")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)