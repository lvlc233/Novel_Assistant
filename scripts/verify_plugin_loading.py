import sys
import os
import asyncio
from pathlib import Path

# Add backend/src to sys.path
backend_src = Path(__file__).parent.parent / "backend" / "src"
sys.path.append(str(backend_src))

from core.plugin.runtime import PluginInternalRegistry

async def main():
    print("Starting plugin discovery verification...")
    
    registry = PluginInternalRegistry()
    
    # Path to the plugins parent directory
    plugins_dir_1 = backend_src / "plugins"
    plugins_dir_2 = backend_src / "plugin"
    
    try:
        print(f"Scanning directory: {plugins_dir_1}")
        registry.discover_plugins(str(plugins_dir_1))
        
        print(f"Scanning directory: {plugins_dir_2}")
        registry.discover_plugins(str(plugins_dir_2))
        
        plugins = registry.plugins
        
        if not plugins:
            print("❌ No plugins found!")
            return
            
        print(f"✅ Found {len(plugins)} plugins:")
        for p in plugins:
            print(f"  - ID: {p['id']}")
            print(f"    Name: {p['name']}")
            print(f"    Version: {p['version']}")
            print(f"    Operations: {list(p['plugin_operation_schema']['operations'].keys())}")
            
            # Verify specific operation details
            ops = p['plugin_operation_schema']['operations']
            if 'say_hello' in ops:
                op = ops['say_hello']
                print(f"    Operation 'say_hello':")
                print(f"      with_ui: {op['with_ui']}")
                print(f"      ui_target: {op['ui_target']}")
                
    except Exception as e:
        print(f"❌ Error during discovery: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
