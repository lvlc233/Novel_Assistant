"""全局异常处理器与业务异常定义（枚举驱动）"""

from __future__ import annotations



from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from api.models import Response
from common.err import BaseError


# ------------------------
# 异常处理器（全局）
# ------------------------

async def base_error_handler(_: Request, exc: BaseError) -> JSONResponse:
    """统一处理 BaseError，输出 Response 模型（驼峰别名）。"""
    resp = Response[dict].fail(code=exc.code, data=exc.data,message=exc.message)
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=500, content=content)


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    """统一处理 HTTPException，兼容 FastAPI/Starlette 抛出的 HTTP 异常。"""
    # 将 HTTP 状态码映射到业务失败枚举，保留原始 detail 作为消息
    resp = Response.fail(message=str(exc.detail), code=exc.status_code)
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=500, content=content)


async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """兜底处理未捕获的异常，输出通用失败响应。"""
    resp = Response.fail(message=str(exc) or "Internal Server Error", code="500")
    # 兜底使用 500，前端据此判定为未预期错误
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=500, content=content)


def register_exception_handlers(app: FastAPI) -> None:
    """在 FastAPI 应用上注册全局异常处理器。"""
    app.add_exception_handler(BaseError, base_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)