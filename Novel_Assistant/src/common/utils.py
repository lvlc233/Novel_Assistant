"""Utility & helper functions."""
import uuid
from datetime import datetime
from typing import Union


from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from common.configer.agent.model_configs import global_model_config

"""
    通用工具函数
"""
def create_uuid() -> str:
    """创建一个 UUID 字符串。"""
    return uuid.uuid4().hex
def passwd_hash(password: str) -> str:
    """密码哈希"""
    import hashlib
    import secrets

    # 生成随机盐
    salt = secrets.token_hex(16)
    # 使用SHA-256进行哈希
    pwd_hash = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    # 返回盐和哈希值的组合
    return f"{salt}${pwd_hash}"

def passwd_verify(password: str, hashed_password: str) -> bool:
    """验证密码

    Args:
        password: 明文密码
        hashed_password: 存储的哈希密码 (格式: salt$hash)

    Returns:
        bool: 密码是否匹配
    """
    import hashlib

    try:
        # 分离盐和哈希值
        salt, stored_hash = hashed_password.split('$', 1)
        # 重新计算哈希
        pwd_hash = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
        # 比较哈希值
        return pwd_hash == stored_hash
    except ValueError:
        # 如果格式不正确，返回False
        return False 

def get_now_time() -> datetime:
    """获取当前时间"""
    return datetime.now().replace(tzinfo=None)
def format_time(time: datetime) -> str:
    """格式化时间"""
    return time.strftime("%Y-%m-%d %H:%M:%S")
""""""
def normalize_region(region: str) -> str | None:
    """Normalize region aliases to standard values.

    Args:
        region: Region string to normalize

    Returns:
        Normalized region ('prc' or 'international') or None if invalid
    """
    if not region:
        return None

    region_lower = region.lower()
    if region_lower in ("prc", "cn"):
        return "prc"
    elif region_lower in ("international", "en"):
        return "international"
    return None


def message_type_to_role(msg_type: BaseMessage) -> str:
    """将消息类型转换为角色字符串."""
    if isinstance(msg_type, HumanMessage):
        return "Human"
    elif isinstance(msg_type, AIMessage):
        return "AI"
    elif isinstance(msg_type, SystemMessage):
        return "System"
    else:
        return "Human"  # 默认用户消息


def get_message_text(msg: BaseMessage) -> str:
    """Get the text content of a message."""
    role = message_type_to_role(msg)
    content = msg.content
    if isinstance(content, str):
        return role + ": " + content
    elif isinstance(content, dict):
        return role + ": " + content.get("text", "")
    else:
        txts = [
            role + ": " + (c if isinstance(c, str) else (c.get("text") or ""))
            for c in content
        ]
        return "".join(txts).strip()


def load_chat_model(
    node_name: str|None = None,
) -> Union[BaseChatModel]:
    """Load a chat model from a model name.

    Args:
        model_name (str): String in the format 'provider:model'.
    """
    if not node_name or node_name not in [k.node_name for k in global_model_config.nodes_config]:
        node_name = "default"
    model_name = global_model_config.get_model_name(node_name)
    api_key = global_model_config.get_api_key(node_name)
    base_url = global_model_config.get_base_url(node_name)
    config = global_model_config.get_config(node_name)

    return init_chat_model(
        model=model_name,
        model_provider="openai",
        api_key=api_key,
        base_url=base_url,
        **config,
    )


def messages_to_plain(messages: list[BaseMessage]) -> SystemMessage:
    """将消息列表转化为一个字符串，每个消息之间用换行符隔开。.
    
    原因:
        结构化输出无法直接用List[BaseMessage]表示(OpenAi接口限制)
        因此需要压缩为一条消息

    Args:
        messages: 要转换的消息列表

    Returns:
        SystemMessage: 包含所有纯文本消息的单个系统消息
    """
    plain_text = "\n".join([get_message_text(msg) for msg in messages])
    return SystemMessage(content=plain_text)


"""
log 相关
"""


def pick_msg_fields(kw, **keys):
    """从AnyMessage中,需要的一些字段字段，缺就返回 None."""
    # 遇到嵌套字典，需要递归提取,当前没设计,可能有问题
    cache = {}
    for k in keys:
        if k in kw:
            cache[k] = kw.get(k, None)
    return cache
    # return {
    #     "content": kw.get("content"),
    #     "type": kw.get("type"),
    #     "id": kw.get("id"),
    #     # "usage_metadata": kw.get("usage_metadata"),
    # }


def value_colour_for_dict(dict: dict, colour: str = "white"):
    """为字典的值添加颜色,colour使用标签形式."""
    for k, v in dict.items():
        dict[k] = f"<{colour}>{v}</{colour}>"
    return dict


def get_run_id_for_node(kwargs: dict):
    """从kwargs中获取当前运行ID和父运行ID。.
    
    Args:
        kwargs: 包含运行参数的字典，可能包含'run_id'和'parent_run_id'键
        
    Returns:
        tuple: (current_run_id, parent_run_id) 的元组，每个ID截取前8位字符，
               如果不存在则返回"None"
    """
    # run id获取
    if kwargs.get("run_id"):
        current_run_id = str(kwargs.get("run_id"))[:8]  # '2ec2766f'
    else:
        current_run_id = "None"
    if kwargs.get("parent_run_id"):
        parent_run_id = str(kwargs.get("parent_run_id"))[:8]  # '2ec2766f'
    else:
        parent_run_id = "None"
    return current_run_id, parent_run_id

from typing import Any, Mapping
from dataclasses import is_dataclass, asdict

def _safe_to_dict(obj: Any) -> dict:
    if obj is None:
        return {}
    # Pydantic v2
    if hasattr(obj, "model_dump") and callable(getattr(obj, "model_dump")):
        try:
            return obj.model_dump()
        except Exception:
            pass
    # Pydantic v1
    if hasattr(obj, "dict") and callable(getattr(obj, "dict")):
        try:
            return obj.dict()
        except Exception:
            pass
    # 映射
    if isinstance(obj, Mapping):
        return dict(obj)
    # dataclass
    if is_dataclass(obj):
        return asdict(obj)
    # 普通对象
    if hasattr(obj, "__dict__"):
        return dict(obj.__dict__)
    # 兜底：转字符串
    return {"value": str(obj)}
"""
基于RecursiveCharacterTextSplitter的章节文档切割器
支持按章节格式切割文档，并保留章节信息和行号
"""

import re
from typing import List, Dict
from langchain_core.documents import Document


class ChapterTextSplitter:
    """按章节切割文档的文本分割器"""
    
    def __init__(self, 
                 chapter_pattern: str = r'^第\d+章\s+.+$'):
        """
        初始化章节文本分割器
        
        Args:
            chapter_pattern: 章节标题的正则表达式模式
        """
        self.chapter_pattern = chapter_pattern
     # 查找所有章节(行号标记)
    def _find_chapters(self, text: str) -> List[Dict]:
        """
        查找文档中的所有章节
        Args:
            text: 文档文本内容
            
        Returns:
            章节信息列表，包含章节标题、起始行号、结束行号等
        """
        lines = text.split('\n')
        chapters = []
        
        for i, line in enumerate(lines, 1):
            # 起始位置
            if re.match(self.chapter_pattern, line.strip()):
                chapters.append({
                    'title': line.strip(),
                    'start_line': i,
                    'content_start_line': i + 1
                })
        
        # 设置每个章节的结束行号
        for i in range(len(chapters)):
            if i < len(chapters) - 1:
                chapters[i]['end_line'] = chapters[i + 1]['start_line'] - 1
            else:
                chapters[i]['end_line'] = len(lines)
        
        return chapters
    
    # 内容提取
    def _extract_chapter_content(self, text: str, chapter_info: Dict) -> str:
        """
        提取指定章节的内容
        
        Args:
            text: 完整文档文本
            chapter_info: 章节信息字典
            
        Returns:
            章节内容文本
        """
        lines = text.split('\n')
        start_idx = chapter_info['start_line']
        end_idx = chapter_info['end_line']
        
        chapter_lines = lines[start_idx:end_idx]
        return '\n'.join(chapter_lines)
    
    def split_by_chapters(self, file_path: str) -> List[Dict]:
        """
        按章节切割文档
        
        Args:
            file_path: 文档文件路径
            
        Returns:
            切割后的文档块列表，每个块包含内容、元数据等信息
        """
        # 读取文档内容
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # 查找所有章节
        chapters = self._find_chapters(text)
        
        # 按章节处理
        all_chunks = []
        
        for chapter_info in chapters:
            # 提取章节内容
            chapter_content = self._extract_chapter_content(text, chapter_info)
            
            # 如果章节内容为空，跳过
            if not chapter_content.strip():
                continue
    
            # 为每个块添加元数据
          
            chunk_info = {
                'content': chapter_content,
                'metadata': {
                    'chapter_title': chapter_info['title']
                }
            }
            all_chunks.append(chunk_info)
        
        return all_chunks

    def to_docment(self, chunks: List[Dict]) -> List[Document]:
        """
        将切割后的块转换为 Document 类型
        
        Args:
            chunks: 切割后的文档块列表，每个块包含内容和元数据
            
        Returns:
            Document 类型的文档对象列表
        """
        return [Document(
            page_content=chunk['content'],
            metadata=chunk['metadata']
        ) for chunk in chunks]
