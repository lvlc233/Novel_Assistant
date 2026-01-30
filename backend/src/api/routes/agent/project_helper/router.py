from typing import List

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from api.base import Response
from api.routes.agent.helper_schema import (
    MessagesSendRequest,
    ProjectHelperChatConfigRequest,
    ProjectHelperChatConfigResponse,
    ProjectHelperResourcesRequest,
    ProjectHelperResourcesResponse,
)

router = APIRouter(prefix="/plugin/agent/project_helper", tags=["agent-project-helper"])

@router.get("/config", response_model=Response[ProjectHelperChatConfigResponse])
async def get_config() -> Response[ProjectHelperChatConfigResponse]:
    """获取项目chat助手的配置."""
    # TODO: Implement actual config retrieval
    data = ProjectHelperChatConfigResponse(
        model_name="gpt-4",
        base_url="https://api.openai.com/v1",
        api_key="sk-...",
        user_prompt="You are a project manager."
    )
    return Response.ok(data=data)

@router.post("/config", response_model=Response[None])
async def update_config(request: ProjectHelperChatConfigRequest) -> Response[None]:
    """修改项目chat助手的配置."""
    # TODO: Implement config update
    return Response.ok()

@router.get("/resources", response_model=Response[List[ProjectHelperResourcesResponse]])
async def get_resources() -> Response[List[ProjectHelperResourcesResponse]]:
    """获取项目chat助手的资源."""
    # TODO: Implement resource retrieval
    return Response.ok(data=[])

@router.post("/resources", response_model=Response[None])
async def update_resources(request: ProjectHelperResourcesRequest) -> Response[None]:
    """修改项目chat助手的资源."""
    # TODO: Implement resource update
    return Response.ok()

@router.post("/chat/{session_id}")
async def chat(session_id: str, request: MessagesSendRequest):
    """和项目chat助手聊天."""
    # TODO: Implement chat logic with SSE
    async def event_generator():
        yield {
            "id": f"project_helper:{session_id}:0",
            "event": "chat/end",
            "data": '{"message_chunk": "This is a mock response."}',
            "retry": 30000
        }

    return EventSourceResponse(event_generator())
