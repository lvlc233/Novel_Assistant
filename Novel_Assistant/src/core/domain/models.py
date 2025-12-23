
"""领域(业务)模型定义."""

from pydantic import BaseModel,Field
from typing import List, Union
from common.enums import NovelState

class NovelItemUse2Overview(BaseModel):
    """小说的单位用于概述"""
    novel_id: str = Field(description="小说ID")
    novel_cover_image_url: str = Field(description="小说封面图片URL")
    novel_name: str = Field(description="小说名称")
    novel_summary: str = Field(description="小说简介")
    novel_state: NovelState = Field(description="小说状态")
    novel_create_time: str = Field(description="创建时间")
    novel_update_time: str = Field(description="最新更新时间")
    novel_hiatus_interval: int = Field(description="断更间隔时间,单位为天")
    novel_word_count: int = Field(description="小说字数")

class DocumentDetailPinnedVersion(BaseModel):
    """指定版本的文档详情。
    """
    doc_id: str = Field(description="文档ID")
    version_id: str = Field(description="版本ID")
    title: str = Field(description="文档标题")
    body_text: str | None = Field(default=None,description="文档内容")
    word_count: int = Field(default=0,description="字数")

class DirectoryNode(BaseModel):
    """目录节点（文件夹或文档）"""
    node_id: str = Field(description="节点ID")
    node_name: str = Field(description="节点名称")
    node_type: str = Field(description="节点类型: folder 或 document")
    sort_order: int = Field(description="排序顺序")
    children: List['DirectoryNode'] = Field(default=[], description="子节点列表")
    
    # 文档特有字段
    word_count: int | None = Field(default=None, description="字数")
    update_time: str | None = Field(default=None, description="更新时间")
    
    # 文件夹特有字段
    create_time: str | None = Field(default=None, description="创建时间")

class NovelDetail(BaseModel):
    """小说详情模型"""
    novel_id: str = Field(description="小说ID")
    novel_name: str = Field(description="小说名称")
    novel_cover_image_url: str | None = Field(default=None, description="小说封面图片URL")
    novel_summary: str | None = Field(default=None, description="小说简介")
    novel_state: str = Field(description="小说状态")
    novel_create_time: str = Field(description="创建时间")
    novel_update_time: str = Field(description="最新更新时间")
    novel_hiatus_interval: int = Field(description="断更间隔时间")
    novel_word_count: int = Field(description="小说字数")
    directory: List[DirectoryNode] = Field(default=[], description="目录树")


