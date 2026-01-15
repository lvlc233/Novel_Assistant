from typing import List
from pydantic import Field, BaseModel
from common.enums import NovelState
from api.base import BaseRequest
from api.routes.document.schema import DirectoryNodeResponse

"""
    小说相关
"""
class CreateNovelRequest(BaseRequest):
    """小说信息"""
    user_id: str = Field(..., description="用户ID")
    novel_cover_image_url: str|None = Field(default=None,description="小说封面url")
    novel_name: str|None = Field(default=None, description="小说名称")
    novel_summary: str|None = Field(default=None, description="小说简介")
    kd_id_list: List[str] = Field(default=[], description="知识库ID列表")

class GetNovelListRequest(BaseRequest):
    """获取小说列表请求"""
    user_id: str = Field(..., description="用户ID")

class GetNovelDetailRequest(BaseRequest):
    """获取小说详情请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")

class DeleteNovelRequest(BaseRequest):
    """删除小说请求"""
    novel_id: str = Field(..., description="小说ID")

class UpdateNovelRequest(BaseRequest):
    """修改小说信息请求"""
    novel_id: str = Field(..., description="小说ID")
    name: str | None = Field(default=None, description="小说名称")
    summary: str | None = Field(default=None, description="小说简介")

# From Domain
class NovelOverview(BaseModel):
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
    directory: List[DirectoryNodeResponse] = Field(default=[], description="目录树")
