"""API模型"""

from datetime import datetime
from typing import Any, TypeVar, Generic
from enum import Enum

from langchain_core.messages import AIMessage,HumanMessage
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from uuid import uuid4


# 将 snake_case 字段名转换为 camelCase，用于 JSON 序列化别名
def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class ApiBaseModel(BaseModel):
    """统一的 API 基类，开启驼峰别名输出与按名称填充。"""

    model_config = ConfigDict(
        alias_generator=to_camel,
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

