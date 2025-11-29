"""API模型"""
from typing import Any, TypeVar, Generic
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict

class ApiBaseModel(BaseModel):
    """统一的 API 基类，开启驼峰别名输出与按名称填充。"""

    model_config = ConfigDict(
        populate_by_name=True,
    )



class CodeEnum(Enum):
    """状态码枚举，包含 code 与默认 message"""

    SUCCESS = ("200", "成功")
    FAIL = ("400", "失败")
    SESSION_NOT_FOUND = ("404", "会话不存在")

    def __init__(self, code: str, message: str):
        self._code = code
        self._message = message

    @property
    def code(self) -> str:
        return self._code

    @property
    def message(self) -> str:
        return self._message
"""
    小说相关
"""
class CreateNovelRequest(BaseModel):
    """小说信息"""
    user_id: str = Field(..., description="用户ID")
    name: str|None = Field(default=None, description="小说名称")
    summary: str|None = Field(default=None, description="小说简介")


class GetNovelListRequest(BaseModel):
    """获取小说列表请求"""
    user_id: str = Field(..., description="用户ID")


class SendQueryToChatHelperRequest(ApiBaseModel):
    """发送查询到聊天助手请求模型"""
    query: str = Field(..., description="用户发送的信息")


T = TypeVar("T")
class Response(ApiBaseModel, Generic[T]):
    """统一响应模型（支持泛型），可用作 Response[InitSessionData] 等"""

    code: str = Field(..., description="状态码")
    data: T | None = Field(default=None, description="响应数据")
    message: str | None = Field(default=None, description="响应消息")
 

    # 允许传入 CodeEnum 自动转换为 code 与默认 message
    @field_validator("code", mode="before")
    @classmethod
    def _code_from_enum(cls, v: Any) -> str:
        if isinstance(v, CodeEnum):
            return str(v.code)
        return str(v)

    @model_validator(mode="after")
    def _fill_default_message(self) -> "Response[T]":
        if self.message is None:
            # 根据当前 code 回填默认 message
            mapping = {e.code: e.message for e in CodeEnum}
            self.message = mapping.get(self.code, "")
        return self

    @classmethod
    def ok(cls, data: T | None = None) -> "Response[T]":
        return cls(code=CodeEnum.SUCCESS, data=data)

    @classmethod
    def fail(cls, message: str | None = None, data: T | None = None, code: CodeEnum = CodeEnum.FAIL) -> "Response[T]":    
        # 支持自定义失败消息，否则使用枚举默认消息
        return cls(code=code, data=data, message=message or code.message)

