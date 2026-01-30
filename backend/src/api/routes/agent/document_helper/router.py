from typing import List

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from api.base import Response
from api.routes.agent.document_helper.schema import (
    DocumentHelperChatConfigRequest,
    DocumentHelperChatConfigResponse,
)
from api.routes.agent.schema import MessagesSendRequest

router = APIRouter(prefix="/plugin/agent/document_helper", tags=["agent-document-helper"])

@router.get("/config", response_model=Response[DocumentHelperChatConfigResponse])
async def get_config() -> Response[DocumentHelperChatConfigResponse]:
    """获取文档创作Chat助手的配置."""
    # TODO: Implement actual config retrieval
    data = DocumentHelperChatConfigResponse()
    return Response.ok(data=data)

@router.post("/config", response_model=Response[None])
async def update_config(request: DocumentHelperChatConfigRequest) -> Response[None]:
    """修改文档创作Chat助手的配置."""
    # TODO: Implement config update
    return Response.ok()

@router.post("/chat/{session_id}")
async def chat(session_id: str, request: MessagesSendRequest):
    """和文档创作助手聊天."""
    # TODO: Implement chat logic with SSE
    async def event_generator():
        yield {
            "id": f"document_helper:{session_id}:0",
            "event": "tool/chat/end",
            "data": '{"message_chunk": "This is a mock response."}',
            "retry": 30000
        }

    return EventSourceResponse(event_generator())
