print("Starting verification...")
import sys
import os
import uuid

# Add backend/src to path
src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
# Add parent of backend to path
root_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

print(f"Adding path: {src_path}")
sys.path.insert(0, src_path)
print(f"Adding path: {root_path}")
sys.path.insert(0, root_path)

try:
    print("Importing utils...")
    from core.plugin.utils import build_plugin_id
    
    plugin_id = build_plugin_id("official", "作品类型")
    print(f"Calculated ID (official/作品类型): {plugin_id}")
    
    plugin_id_sys = build_plugin_id("system", "作品类型")
    print(f"Calculated ID (system/作品类型): {plugin_id_sys}")
    
    plugin_id_worktype = build_plugin_id("official", "work_type")
    print(f"Calculated ID (official/work_type): {plugin_id_worktype}")
    
    print("Importing pg_client...")
    from infrastructure.pg.pg_client import get_session
    print("Importing home...")
    from core.ui.home import Home,Works
    print("Importing WorkTypePlugin...")
    from plugin.work_type.plugin import WorkTypePlugin
    print("Imports successful")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

def verify():
    # 1. Check ID from util
    # In utils.py: default_space = uuid.NAMESPACE_DNS (which is 6ba7b810-9dad-11d1-80b4-00c04fd430c8)
    # from_type_space = uuid.uuid5(default_space, "official")
    # plugin_id = uuid.uuid5(from_type_space, "作品类型")
    
    plugin_id = build_plugin_id("official", "作品类型")
    print(f"Calculated ID: {plugin_id}")
    
    # 2. Check Wrapper
    if hasattr(WorkTypePlugin, "__plugin_wrapper__"):
        wrapper = WorkTypePlugin.__plugin_wrapper__
        definition = wrapper.build_definition()
        print(f"Plugin Definition ID: {definition.id}")
        print(f"Plugin Name: {definition.name}")
    else:
        print("WorkTypePlugin does not have __plugin_wrapper__. Decoration failed?")

if __name__ == "__main__":
    verify()
