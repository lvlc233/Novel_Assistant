from typing import Any, List, Tuple, Dict, cast
from langchain_core.messages import SystemMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import BaseModel, Field
from langgraph.types import Send

from core.agents.kd_builder.state import KDBuildState, Allocation
from core.agents.kd_builder.prompts import (
    ATTENTION_READ_PROMPT,
    ATOM_SUBMIT_PROMPT,
    DEPENDENCE_SUBMIT_PROMPT,
    COMPLETE_KD_PROMPT,
    CYPHER_BUILD_PROMPT,
)
from common.utils import load_chat_model

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

# ========== 路由 ==========
def allocation_router(state: Allocation) -> List[Send]:
    return [Send("KD_build_node", {"document": d}) for d in state["documents"]]

def loop_attention_router(state: KDBuildState) -> str | List[str]:
    # Ensure chunks exist
    chunks = state.get("chunks", [])
    now_index = state.get("now_chunk_index", 0)
    print(f"now_chunk_index: {now_index}, len(chunks): {len(chunks)}")
    
    if now_index < len(chunks):
        return "attention_node"
    return ["atom_entity_node", "dependence_entity_node"]

# ========== 文档 → 切块 ==========
async def chunk_node(state: KDBuildState) -> Dict[str, Any]:
    """
    把 KDBuildState.document 做简单固定长度切块
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,      # 每块 ≤ 500 字符
        chunk_overlap=20,    # 重复 20 字符
        length_function=len,
        separators=["\n\n", "\n", " ", ""],
    )

    document = state.get("document", "")
    chunks = text_splitter.split_text(document)
    
    # Initialize other fields if needed, but returning dict updates them
    return {"chunks": chunks, "now_chunk_index": 0, "attention_chunk": {}}

# ========== 切块 → attention ==========
async def attention_node(state: KDBuildState) -> Dict[str, Any]:
    # 获取配置中的模型
    model = load_chat_model("attention_node")
    
    chunks = state.get("chunks", [])
    now_index = state.get("now_chunk_index", 0)
    attention_chunk = state.get("attention_chunk", {})
    
    if now_index >= len(chunks):
        return {}

    current_sentence = chunks[now_index]
    
    system_prompt = SystemMessage(content=ATTENTION_READ_PROMPT.format(
        impression=attention_chunk,
        sentence=current_sentence
    ))
    
    struct_model = model.with_structured_output(AttentionStruct)
    response = cast(AttentionStruct, await struct_model.ainvoke([system_prompt]))
    
    # Update attention dictionary
    # Note: In LangGraph, to update a dict/list in state, you usually return the new value.
    # If the state field is defined with a reducer (like add_messages), it merges.
    # For simple fields (like Dict), it typically overwrites unless a reducer is used.
    # Here we assume overwrite behavior for Dict based on typical Pydantic/TypedDict behavior in LangGraph without reducers.
    # To be safe, we return the whole updated dict.
    
    new_attention_chunk = attention_chunk.copy()
    new_attention_chunk[now_index] = response.impression
    
    return {
        "attention_chunk": new_attention_chunk,
        "now_chunk_index": now_index + 1
    }

# ========== attention → 原子实体 ==========
async def atom_entity_node(state: KDBuildState) -> Dict[str, Any]:
    model = load_chat_model("atom_entity_node")
    attention_chunk = state.get("attention_chunk", {})
    
    system_prompt = SystemMessage(content=ATOM_SUBMIT_PROMPT.format(content=attention_chunk))

    structured = model.with_structured_output(EntityStruct)
    resp = cast(EntityStruct, await structured.ainvoke([system_prompt]))
    
    return {"atom_entity": resp.entities}

# ========== attention → 依赖实体 ==========
async def dependence_entity_node(state: KDBuildState) -> Dict[str, Any]:
    model = load_chat_model("dependence_entity_node")
    attention_chunk = state.get("attention_chunk", {})
    
    system_prompt = SystemMessage(content=DEPENDENCE_SUBMIT_PROMPT.format(content=attention_chunk))

    structured = model.with_structured_output(EntityStruct)
    resp = cast(EntityStruct, await structured.ainvoke([system_prompt]))
    
    return {"dependence_entity": resp.entities}

# ========== 实体 → 属性 & 关系 ==========
async def complete_node(state: KDBuildState) -> Dict[str, Any]:
    model = load_chat_model("complete_node")
    structured = model.with_structured_output(KDComplateStruct)
    
    system_prompt = SystemMessage(content=COMPLETE_KD_PROMPT.format(
        attention=state.get("attention_chunk", {}),
        atom=state.get("atom_entity", []),
        depend=state.get("dependence_entity", []),
        document=state.get("document", ""),
    ))
    
    resp = cast(KDComplateStruct, await structured.ainvoke([system_prompt]))

    return {
        "full_node": resp.full_node,
        "relation": resp.relations
    }

# ========== 属性/关系 → CQL ==========
async def cypher_node(state: KDBuildState) -> Dict[str, Any]:
    model = load_chat_model("cypher_node")
    
    system_prompt = SystemMessage(content=CYPHER_BUILD_PROMPT.format(
        full_node=state.get("full_node", {}),
        relation=state.get("relation", []),
    ))
    
    structured = model.with_structured_output(CypherStruct)
    resp = cast(CypherStruct, await structured.ainvoke([system_prompt]))

    return {"cypher": resp.cypher}
