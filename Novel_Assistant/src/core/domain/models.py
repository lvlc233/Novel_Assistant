
"""领域模型定义."""
from enum import Enum
from typing import List, Union

from pydantic import BaseModel, Field

class TableOfContentsEntity(BaseModel):
    """目录项."""
    chapter_id: str = Field(description="章节ID")
    chapter_name: str = Field(description="章节名称")
    chapter_current_version: str = Field(description="章节版本")
 

class FolderEntity(BaseModel):
    """文件夹实体."""
    folder_id: str = Field(description="文件夹ID")
    folder_name: str = Field(description="文件夹名称")
    create_time: str = Field(description="创建时间")
    table_of_contents: List[TableOfContentsEntity] = Field(description="目录项列表")



class NovelState(str, Enum):
    """小说状态."""
    UPDATING = "更新中"
    COMPLETED = "已完结"
    DELETED = "已删除"

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
    hiatus_interval: str = Field(description="断更间隔时间,单位为天")
    table_of_contents: List[Union[FolderEntity, TableOfContentsEntity]] = Field(description="小说目录")
