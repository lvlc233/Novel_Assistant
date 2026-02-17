
import uuid

def build_plugin_id(from_type:str,plugin_name:str):
    default_space = uuid.NAMESPACE_DNS
    from_type_space = uuid.uuid5(default_space, from_type)
    plugin_id = uuid.uuid5(from_type_space,plugin_name)

    return plugin_id

