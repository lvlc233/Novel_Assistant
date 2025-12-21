
"""领域模型定义."""

from tkinter import N
from typing import List, Union
from pydantic import BaseModel, Field

from common.enums import NovelState

class TableOfContentsEntity(BaseModel):
    """目录项."""
    document_id: str = Field(description="文档ID")
    document_name: str = Field(description="文档名称")
    document_current_version: str = Field(description="文档版本")
    document_version_list: List[str] = Field(description="文档版本列表")
    
class FolderEntity(BaseModel):
    """文件夹实体."""
    folder_id: str = Field(description="文件夹ID")
    folder_name: str = Field(description="文件夹名称")
    create_time: str = Field(description="创建时间")
    table_of_contents: List[TableOfContentsEntity] = Field(description="目录项列表")
class NovelDomain(BaseModel):
    """小说."""
    novel_id: str = Field(description="小说ID")
    user_id: str = Field(description="用户ID")
    image_url: str = Field(description="小说封面图片URL")
    novel_name: str = Field(description="小说名称")
    summary: str = Field(description="小说简介")
    state: NovelState = Field(description="小说状态")
    create_time: str = Field(description="创建时间")
    update_time: str = Field(description="最新更新时间")
    hiatus_interval: int = Field(description="断更间隔时间,单位为天")
    table_of_contents: List[Union[FolderEntity, TableOfContentsEntity]] = Field(description="小说目录")

class DocumentVersionEntity(BaseModel):
    """文档版本实体."""
    version_id: str = Field(description="版本ID")
    parent_version_id: str|None = Field(default=None,description="父版本ID")
    
class DocumentDomain(BaseModel):
    """文档实体."""
    doc_id: str = Field(description="文档ID")
    title: str = Field(description="文档标题")
    current_version_id: str = Field(description="当前版本ID")
    version_list: List[DocumentVersionEntity] = Field(description="文档版本列表")
    body_text: str | None = Field(default=None,description="文档内容")
    create_time: str = Field(description="创建时间")
    update_time: str = Field(description="更新时间")


