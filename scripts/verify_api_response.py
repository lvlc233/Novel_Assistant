import sys
import asyncio
from pathlib import Path
import inspect

# Add backend/src to sys.path
backend_src = Path(__file__).parent.parent / "backend" / "src"
sys.path.append(str(backend_src))

from core.plugin.runtime import PluginInternalRegistry

async def main():
    print("Starting API response verification...")
    
    registry = PluginInternalRegistry()
    plugins_dir = backend_src / "plugins"
    registry.discover_plugins(str(plugins_dir))
    
    # Find HelloWorld plugin
    plugin_def = next((p for p in registry.plugins if p["name"] == "HelloWorld"), None)
    if not plugin_def:
        print("❌ HelloWorld plugin not found")
        return

    print(f"✅ Found HelloWorld plugin: {plugin_def['id']}")
    
    wrapper = registry.get_plugin_wrapper(plugin_def["id"])
    if not wrapper:
        print("❌ Wrapper not found")
        return

    # Create instance
    instance = wrapper.create_instance()
    
    # Invoke say_hello
    print("Invoking 'say_hello' with name='Tester'...")
    try:
        result = wrapper.invoke(instance, "say_hello", name="Tester")
        print(f"✅ Result: {result}")
        
        # Verify result structure
        expected_keys = {"message", "user_name"}
        if not isinstance(result, dict):
             print(f"❌ Result is not a dict: {type(result)}")
             return
             
        keys = set(result.keys())
        if keys != expected_keys:
             print(f"❌ Unexpected keys: {keys}. Expected: {expected_keys}")
             return
             
        if result["message"] != "Hello, Tester!":
             print(f"❌ Incorrect message: {result['message']}")
             return
             
        print("✅ Verification Passed!")
        
    except Exception as e:
        print(f"❌ Invocation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
