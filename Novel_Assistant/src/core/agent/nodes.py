from core.agent.state import KDBuildState

from common.config.agent.model_configs import get_global_model_config_loader
from common.utils import load_chat_model
from common.decorator import node
"""
    kd: 知识库生成相关
"""
@node(node_name="atom_build")
async def atom_build(state: KDBuildState):
    # 获取配置中的模型
    _cfg = get_global_model_config_loader().load_config()
    print(_cfg.get_model_name())
    model = load_chat_model(_cfg.get_model_name())
    #导入文本
    docs=state.documents
    doc=docs["1"]
    model.ainvoke()
    return []

