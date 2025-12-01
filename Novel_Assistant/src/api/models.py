"""API模型"""
from typing import Any, TypeVar, Generic
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict

"""请求相关"""
class BaseRequest(BaseModel):
    """统一的 API 请求基类。"""
    pass
"""
    用户相关
"""
class CreateUserRequest(BaseRequest):
    """用户信息"""
    name: str|None = Field(default=None, description="用户名称")
    password: str|None = Field(default=None, description="用户密码")


"""
    小说相关
"""
class CreateNovelRequest(BaseRequest):
    """小说信息"""
    user_id: str = Field(..., description="用户ID")
    name: str|None = Field(default=None, description="小说名称")
    summary: str|None = Field(default=None, description="小说简介")


class GetNovelListRequest(BaseRequest):
    """获取小说列表请求"""
    user_id: str = Field(..., description="用户ID")


class SendQueryToChatHelperRequest(BaseRequest):
    """发送查询到聊天助手请求模型"""
    query: str = Field(..., description="用户发送的信息")



class UserIdResponse(BaseModel):
    """用户ID"""
    user_id: str = Field(..., description="用户ID")

class NovelIdResponse(BaseModel):
    """小说ID"""
    novel_id: str = Field(..., description="小说ID")
    novel_name: str = Field(..., description="小说名称")
    image_url: str|None = Field(default=None, description="小说封面URL")
    summary: str|None = Field(default=None, description="小说简介")
    state: str = Field(..., description="小说状态")
    create_time: str = Field(..., description="创建时间")
    update_time: str = Field(..., description="更新时间")
    hiatus_interval: int = Field(..., description="上次更新时间间隔（天）")
  

T = TypeVar("T")
class Response(BaseModel, Generic[T]):
    """统一响应模型（支持泛型），可用作 Response[InitSessionData] 等"""

    code: str = Field(..., description="状态码")
    data: T | None = Field(default=None, description="响应数据")
    message: str | None = Field(default=None, description="响应消息")
 

    @classmethod
    def ok(cls, data: T | None = None) -> "Response[T]":
        return cls(code="200", data=data)

    @classmethod
    def fail(cls,code:str, message: str , data: T | None = None) -> "Response[T]":    
        # 支持自定义失败消息，否则使用枚举默认消息
        return cls(code=code, data=data, message=message )

