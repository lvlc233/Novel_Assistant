from langgraph.graph import StateGraph
from common.context import Context
from common.config.agent.node_configs import get_global_node_config_loader
from .state import KDBuildState
from .nodes import atom_build

class KDBuildGraph:
    
    def __init__(self,config_dir: str="config",filename: str="graph_config.yaml"):
        # 从配置模型数据中加载
        self._cfg=get_global_node_config_loader(config_dir).load_config(filename)

    def build(self):
        graph=StateGraph(KDBuildState)
        graph.add_node("atom_build",atom_build).set_entry_point("atom_build").set_finish_point("atom_build")
        return graph.compile()
        