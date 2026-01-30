from typing import Generic, TypeVar

from pydantic import BaseModel, Field


class BaseRequest(BaseModel):
    """统一的 API 请求基类。."""
    pass

T = TypeVar("T")
class Response(BaseModel, Generic[T]):
    """统一响应模型（支持泛型），可用作 Response[InitSessionData] 等."""

    code: int = Field(..., description="状态码")
    data: T | None = Field(default=None, description="响应数据")
    message: str | None = Field(default=None, description="响应消息")
 

    @classmethod
    def ok(cls, data: T | None = None) -> "Response[T]":
        return cls(code=200, data=data)

    @classmethod
    def fail(cls,code: int, message: str , data: T | None = None) -> "Response[T]":    
        # 支持自定义失败消息，否则使用枚举默认消息
        return cls(code=code, data=data, message=message )
