from typing import Dict,List

from fastapi import APIRouter
from langchain_core.messages import AIMessage

from api.models import SendQueryToChatHelperRequest, Response
router = APIRouter(tags=[""])

@router.post("/get", response_model_by_alias=True)
async def send_message(request: SendQueryToChatHelperRequest):
    """发送消息 - 简化版本，返回基础响应"""
    # 模拟AI响应
    ai_message = AIMessage(content="你好！我是小说创作助手，很高兴为您提供帮助。")

    return Response.ok({
        "message": ai_message.content,
        "timestamp": ai_message.timestamp if hasattr(ai_message, 'timestamp') else None,
        "session_id": "default_session"
    })