from dataclasses import dataclass,field
from dataclasses_json import dataclass_json
@dataclass_json
@dataclass
class KD:
    """
        知识数据类,用于存储Agent的知识数据信息
        知识库存储包括从 `向量数据库`, `图数据库`, `文档数据库` 等不同类型的知识库中获取的信息
        并将不同的数据、知识统一为一个标准的`知识数据`格式
        理由:
            扩展,
            统一,
            方便,
    """
    id:str
    content:str
    metadata:dict = field(default_factory=dict)


def graph_data_to_KD(graph)->KD:
    """
        将图数据转换为知识数据
    """
    pass 

def vector_data_to_KD(vector)->KD:
    """
        将向量数据转换为知识数据
    """
    pass 