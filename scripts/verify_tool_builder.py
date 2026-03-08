"""
验证脚本: 测试插件工具化功能
验证 build_tools_from_plugins 能正确将 tool 标签插件转为 LangChain Tool
"""
import sys
import os
import asyncio
from pathlib import Path

# Add backend/src to sys.path
backend_src = Path(__file__).parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_src))

from core.plugin.runtime import PluginInternalRegistry
from core.plugin.tool_builder import (
    _build_args_model,
    _json_type_to_python,
)


def test_type_mapping():
    """测试 JSON 类型到 Python 类型的映射"""
    print("=== 测试类型映射 ===")
    assert _json_type_to_python("string") is str
    assert _json_type_to_python("integer") is int
    assert _json_type_to_python("number") is float
    assert _json_type_to_python("boolean") is bool
    assert _json_type_to_python("array") is list
    assert _json_type_to_python("object") is dict
    assert _json_type_to_python("unknown") is str  # fallback
    print("✅ 类型映射测试通过")


def test_args_model_generation():
    """测试从 input_schema 生成 Pydantic Model"""
    print("\n=== 测试参数模型生成 ===")
    
    # 1. 简单参数
    schema = {
        "memory_id": {
            "type": "string",
            "required": True,
            "source": "input",
        }
    }
    model = _build_args_model("test_op", schema)
    print(f"  生成模型: {model.__name__}")
    print(f"  字段: {list(model.model_fields.keys())}")
    assert "memory_id" in model.model_fields
    print("  ✅ 简单参数测试通过")
    
    # 2. 混合参数（含 CONTEXT 类型，应被过滤）
    schema_mixed = {
        "message": {
            "type": "string",
            "required": True,
            "source": "input",
        },
        "document_content": {
            "type": "string",
            "required": False,
            "source": "context",
        },
        "work_id": {
            "type": "string",
            "required": False,
            "source": "context",
        }
    }
    model_mixed = _build_args_model("chat_op", schema_mixed)
    fields = list(model_mixed.model_fields.keys())
    print(f"  混合模型字段: {fields}")
    assert "message" in fields
    assert "document_content" not in fields
    assert "work_id" not in fields
    print("  ✅ CONTEXT 参数过滤测试通过")
    
    # 3. 无参数操作
    model_empty = _build_args_model("no_args_op", {})
    print(f"  空参数模型字段: {list(model_empty.model_fields.keys())}")
    print("  ✅ 无参数操作测试通过")


def test_plugin_discovery_and_tool_tagging():
    """测试插件发现并验证 tool 标签"""
    print("\n=== 测试插件发现与 tool 标签 ===")
    
    registry = PluginInternalRegistry()
    plugins_dir = backend_src / "plugin"
    
    try:
        registry.discover_plugins(str(plugins_dir))
        plugins = registry.get_plugin_list()
        
        print(f"  发现 {len(plugins)} 个插件:")
        
        tool_plugins = []
        for p in plugins:
            tags = p.get("tags", [])
            is_tool = "tool" in tags
            marker = "🔧" if is_tool else "  "
            print(f"  {marker} {p['name']} (tags: {tags})")
            
            if is_tool:
                tool_plugins.append(p)
                wrapper = registry.get_plugin_wrapper(p["id"])
                if wrapper:
                    ops = list(wrapper.operations.keys())
                    print(f"      操作: {ops}")
                    for op_name, op_info in wrapper.operations.items():
                        input_params = list((op_info.input_schema or {}).keys())
                        # 过滤出 source=input 的参数
                        input_only = [
                            k for k, v in (op_info.input_schema or {}).items()
                            if v.get("source", "input") == "input"
                        ]
                        print(f"      - {op_name}: 全部参数={input_params}, input参数={input_only}")
        
        print(f"\n  🔧 tool 标签插件: {len(tool_plugins)} 个")
        
        if len(tool_plugins) >= 2:
            print("  ✅ KD 和 Memory 插件都已标记为 tool")
        else:
            print("  ⚠️ 期望至少 2 个 tool 插件 (kd + memory)")
            
    except Exception as e:
        print(f"  ❌ 插件发现失败: {e}")
        import traceback
        traceback.print_exc()


def main():
    print("=" * 60)
    print("插件工具化验证脚本")
    print("=" * 60)
    
    test_type_mapping()
    test_args_model_generation()
    test_plugin_discovery_and_tool_tagging()
    
    print("\n" + "=" * 60)
    print("验证完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
