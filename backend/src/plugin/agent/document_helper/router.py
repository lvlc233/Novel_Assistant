
from fastapi import APIRouter
# from sse_starlette.sse import EventSourceResponse
#
# from api.base import Response
# from api.routes.agent.document_helper.schema import (
#     DocumentHelperChatConfigRequest,
#     DocumentHelperChatConfigResponse,
# )
# from api.routes.agent.schema import MessagesSendRequest

router = APIRouter(prefix="/plugin/agent/document_helper", tags=["agent-document-helper"])

# 开发者: BackendAgent(python)
# 当前版本: BE-DEP-20260224-01
# 创建时间: 2026-02-24 00:22
# 更新时间: 2026-02-24 00:22
# 更新记录:
#     [2026-02-24 00:22:BE-DEP-20260224-01: 注释掉未使用的文档助手接口，避免暴露未接入功能。]
# 注释者: BackendAgent(python)
# 时间: 2026-02-24 00:22
# 使用位置: 后端路由 /plugin/agent/document_helper (未被前端调用)
# 实现概述: 注释掉文档助手配置与聊天接口，保留路由对象以便后续恢复。
# 废弃标记: 已废弃
# @router.get("/config", response_model=Response[DocumentHelperChatConfigResponse])
# async def get_config() -> Response[DocumentHelperChatConfigResponse]:
#     """获取文档创作Chat助手的配置."""
#     # TODO: Implement actual config retrieval
#     data = DocumentHelperChatConfigResponse()
#     return Response.ok(data=data)
#
# @router.post("/config", response_model=Response[None])
# async def update_config(request: DocumentHelperChatConfigRequest) -> Response[None]:
#     """修改文档创作Chat助手的配置."""
#     # TODO: Implement config update
#     return Response.ok()
#
# @router.post("/chat/{session_id}")
# async def chat(session_id: str, request: MessagesSendRequest):
#     """和文档创作助手聊天."""
#     # TODO: Implement chat logic with SSE
#     async def event_generator():
#         yield {
#             "id": f"document_helper:{session_id}:0",
#             "event": "tool/chat/end",
#             "data": '{"message_chunk": "This is a mock response."}',
#             "retry": 30000
#         }
#
#     return EventSourceResponse(event_generator())
