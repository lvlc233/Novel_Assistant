
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from api.models import SendQueryToChatHelperRequest
from api.services.chat_help_service import call_chat_helper
router = APIRouter(tags=["chat_helper"])

@router.get("/send_message/{query}", response_model_by_alias=True)
async def send_message(query: str)->EventSourceResponse:
    """发送消息 - 简化版本，返回基础响应"""

    return EventSourceResponse(call_chat_helper(query),ping=5)
        
