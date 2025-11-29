from typing import Any, List, Tuple, cast

from langchain_core.messages import  SystemMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter

from core.agent.state import KDBuildState


from common.utils import load_chat_model
from common.decorator import node


from pydantic import BaseModel,Field


"""
    kd: 知识库生成相关
"""



"""
kd: 知识库构建专用节点
"""
from typing import List, Dict, cast

from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage
from langgraph.types import Send
from core.agent.state import KDBuildState, Allocation
from core.agent.llm.prompts import (ATTENTION_READ_PROMPT,
                                ATOM_SUBMIT_PROMPT,
                                DEPENDENCE_SUBMIT_PROMPT,
                                COMPLETE_KD_PROMPT,
                                CYPHER_BUILD_PROMPT,
                                )
from common.utils import load_chat_model
from common.decorator import node


# ========== 结构化输出模型 ==========
# 注意力
class AttentionStruct(BaseModel):
    impression: List[str] = Field(
        default_factory=list,
        description="引起你注意的内容，多条用逗号隔开"
    )
    reason: str = Field(
        default="",
        description="引起注意的原因或认为不重要的理由"
    )

# 实体
class EntityStruct(BaseModel):
    entities: List[str] = Field(
        default_factory=list,
        description="实体列表"
    )


class KDComplateStruct(BaseModel):
    full_node: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="完整的节点信息，即节点及其属性,其中key为节点名称,value为节点的属性字典,属性字典标识属性名和属性值"
    )
    relations: List[tuple[str, str, str]] = Field(
        default_factory=list,
        description="关系列表,每个元素为一个关系三元组,格式为(实体1, 关系, 实体2)"
    )


class CypherStruct(BaseModel):
    cypher: List[str] = Field(
        default_factory=list,
        description="最终生成的 Cypher 语句"
    )




async def allocation_router(state: Allocation) -> Send:
    return [Send("KD_build_node", {"document": d}) for d in state.documents]


# ========== 文档 → 切块 ==========
@node(node_name="chunk_node")
async def chunk_node(state: KDBuildState) -> KDBuildState:
    """
    把 KDBuildState.document 做简单固定长度切块，
    返回全新的 KDBuildState。
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,      # 每块 ≤ 400 字符
        chunk_overlap=20,  # 重复 20 字符
        length_function=len,
        separators=["\n\n", "\n", " ", ""],  # 默认即可
    )

    chunks: List[str] = []
    state.document=state.document
    chunks += text_splitter.split_text(state.document)

    return {"chunks":chunks}





# ========== 切块 → attention ==========
@node(node_name="attention_node")
async def attention_node(state: KDBuildState) -> KDBuildState:
    # 获取配置中的模型
    model=load_chat_model("attention_node")
    system_prompt=SystemMessage(content=ATTENTION_READ_PROMPT.format(impression=state.attention_chunk,sentence=state.chunks[state.now_chunk_index]))
    struct_model=model.with_structured_output(AttentionStruct)
    response=cast(AttentionStruct,await struct_model.ainvoke([system_prompt]))
    state.attention_chunk[state.now_chunk_index]=response.impression
    return {"attention_chunk":state.attention_chunk,"now_chunk_index":state.now_chunk_index+1}

#  ========== attention 循环 ==========
async def loop_attention_router(state: KDBuildState) ->str|List[str]:
    print(f"now_chunk_index: {state.now_chunk_index}, len(chunks): {len(state.chunks)}")
    if state.now_chunk_index < len(state.chunks):
        return "attention_node"
    return ["atom_entity_node","dependence_entity_node"]







# ========== attention → 原子实体 ==========
@node(node_name="atom_entity_node")
async def atom_entity_node(state: KDBuildState) -> KDBuildState:
    model = load_chat_model("atom_entity_node")
    system_prompt=SystemMessage(content=ATOM_SUBMIT_PROMPT.format(content=state.attention_chunk))

    structured = model.with_structured_output(EntityStruct)
    resp: EntityStruct = await structured.ainvoke([system_prompt])
    return {"atom_entiy": resp.entities}
# ========== attention → 依赖实体 ==========
@node(node_name="dependence_entity_node")
async def dependence_entity_node(state: KDBuildState) -> KDBuildState:
    model = load_chat_model("dependence_entity_node")
    system_prompt=SystemMessage(content=DEPENDENCE_SUBMIT_PROMPT.format(content=state.attention_chunk))

    structured = model.with_structured_output(EntityStruct)
    resp: EntityStruct =  await structured.ainvoke([system_prompt])
    return {"dependence_entiy": resp.entities}



# ==========实体 → 属性 & 关系 ==========
@node(node_name="complete_node")
async def complete_node(state: KDBuildState) -> KDBuildState:
    model = load_chat_model("complete_node")
    structured = model.with_structured_output(KDComplateStruct)
    system_prompt=SystemMessage(content=COMPLETE_KD_PROMPT.format(
                                        attention=state.attention_chunk,
                                        atom=state.atom_entiy,
                                        depend=state.dependence_entiy,
                                        document=state.document,
                                        ))
    resp: KDComplateStruct = await structured.ainvoke([system_prompt])

    state.full_node = resp.full_node
    state.relation = resp.relations
    return state


# ========== 5. 属性/关系 → CQL ==========
@node(node_name="cypher_node")
async def cypher_node(state: KDBuildState) -> KDBuildState:
    model = load_chat_model("cypher_node")
    system_prompt=SystemMessage(content=CYPHER_BUILD_PROMPT.format(
                                        full_node=state.full_node,
                                        relation=state.relation,
                                        ))
    structured = model.with_structured_output(CypherStruct)
    resp: CypherStruct = await structured.ainvoke([system_prompt])

    state.cypher = resp.cypher
    return state

