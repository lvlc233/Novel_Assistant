"""全局异常处理器与业务异常定义（枚举驱动）"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from .models import CodeEnum, Response


class BaseError(Exception):
    """业务异常基类：由 CodeEnum 驱动，统一承载 code 与 message。

    - code 由枚举定义，保证前后端语义一致
    - message 可覆盖枚举默认消息
    - data 用于附带额外上下文（可选）
    """

    def __init__(self, code: CodeEnum, message: str | None = None, data: Any | None = None) -> None:
        self.code_enum = code
        self.message = message or code.message
        self.data = data
        super().__init__(self.message)


class SessionNotFoundError(BaseError):
    """会话不存在异常（示例），使用 CodeEnum.SESSION_NOT_FOUND"""

    def __init__(self, session_id: str):
        super().__init__(CodeEnum.SESSION_NOT_FOUND, message=f"会话不存在: {session_id}")
        self.session_id = session_id


# ------------------------
# 异常处理器（全局）
# ------------------------

async def base_error_handler(_: Request, exc: BaseError) -> JSONResponse:
    """统一处理 BaseError，输出 Response 模型（驼峰别名）。"""
    resp = Response[dict].fail(message=exc.message, data=exc.data, code=exc.code_enum)
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=exc.code_enum.code, content=content)


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    """统一处理 HTTPException，兼容 FastAPI/Starlette 抛出的 HTTP 异常。"""
    # 将 HTTP 状态码映射到业务失败枚举，保留原始 detail 作为消息
    resp = Response.fail(message=str(exc.detail), code=CodeEnum.FAIL)
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=exc.status_code, content=content)


async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """兜底处理未捕获的异常，输出通用失败响应。"""
    resp = Response.fail(message=str(exc) or CodeEnum.FAIL.message, code=CodeEnum.FAIL)
    # 兜底使用 500，前端据此判定为未预期错误
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=500, content=content)


def register_exception_handlers(app: FastAPI) -> None:
    """在 FastAPI 应用上注册全局异常处理器。"""
    app.add_exception_handler(BaseError, base_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)