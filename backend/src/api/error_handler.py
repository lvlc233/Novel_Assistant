"""全局异常处理器与业务异常定义（枚举驱动）."""

from __future__ import annotations

import traceback
from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.responses import JSONResponse

from api.base import Response
from common.errors import BaseError
from common.log.log import logger

# ------------------------
# 异常处理器（全局）
# ------------------------

async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """处理请求参数验证异常."""
    logger.error(f"Request Validation Error: {exc.errors()}\nBody: {exc.body}")
    resp = Response.fail(message="Request Validation Error", code=422, data=exc.errors())
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=422, content=content)

async def base_error_handler(_: Request, exc: BaseError) -> JSONResponse:
    """统一处理 BaseError，输出 Response 模型（驼峰别名）。."""
    status_code = 500
    
    # 根据错误码映射 HTTP 状态码
    if exc.code == 40400 or str(exc.code).startswith("520"): # 520x are not found errors in common/errors.py
        status_code = 404
    elif str(exc.code).startswith("4"): # Assuming 4xxxx codes are client errors
        status_code = 400
        
    logger.warning(f"Business Error: {exc.message} (Code: {exc.code})")
    resp = Response[dict].fail(code=exc.code, data=exc.data, message=exc.message)
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=status_code, content=content)


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    """统一处理 HTTPException，兼容 FastAPI/Starlette 抛出的 HTTP 异常。."""
    logger.warning(f"HTTP Exception: {exc.detail} (Status: {exc.status_code})")
    # 将 HTTP 状态码映射到业务失败枚举，保留原始 detail 作为消息
    resp = Response.fail(message=str(exc.detail), code=exc.status_code)
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=500, content=content)


async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """兜底处理未捕获的异常，输出通用失败响应。."""
    logger.error(f"Unhandled Exception: {exc}\n{traceback.format_exc()}")
    resp = Response.fail(message=str(exc) or "Internal Server Error", code=500)
    # 兜底使用 500，前端据此判定为未预期错误
    content = jsonable_encoder(resp.model_dump(by_alias=True))
    return JSONResponse(status_code=500, content=content)


def register_exception_handlers(app: FastAPI) -> None:
    """在 FastAPI 应用上注册全局异常处理器。."""
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(BaseError, base_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)