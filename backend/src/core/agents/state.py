from typing import Dict,List,Any,Tuple,Annotated
from pydantic import BaseModel,Field

from langchain_core.messages import AnyMessage,AIMessage
from langgraph.graph import add_messages


"""
    知识图谱构建
"""
class Allocation(BaseModel):
    documents:List[str]=Field(default_factory=list,description="需要构建知识库的文档")

class KDBuildState(BaseModel):
    document:str=Field(default_factory=str,description="当前处理的文档")
    chunks:List[str]=Field(default_factory=list,description="当前处理的文档块")
    # 注意力
    now_chunk_index:int=Field(default_factory=int,description="当前处理的文档块的索引")
    attention_chunk:Dict[int,List[str]]=Field(default_factory=dict,description="当前处理的文档块的注意力实体")
    
    # 实体
    atom_entiy:List[str]=Field(default_factory=list,description="当前处理的文档块的原子实体")
    dependence_entiy:List[str]=Field(default_factory=list,description="当前处理的文档块的依赖实体")

    full_node:Dict[str, Dict[str, Any]]=Field(default_factory=dict,description="当前处理的文档块的知识图谱节点")
    relation:List[Tuple[str, str, str]]=Field(default_factory=list,description="当前处理的文档块的关系")

    # 知识图谱
    cypher:List[str]=Field(default_factory=list,description="当前处理的查询")
"""
    chat助手状态
"""
class ChatHelperState(BaseModel):
    now_query:str|None=Field(default=None,description="用户的查询")
    now_ai_chat_message:AIMessage|None=Field(default=None,description="当前AI的回复")
    history:Annotated[List[AnyMessage],add_messages]=Field(default_factory=list)
    role:str=Field(default_factory=str,description="角色身份")
    # now_memory_load:bool=Field(default_factory=bool,description="是否需要加载记忆")

