
from langchain_core.messages import HumanMessage
from sse_starlette.sse import ServerSentEvent
from core.agent.agent_runnable import chat_helper
import uuid


async def call_chat_helper(query: str):
    response = chat_helper.astream({"messages": [HumanMessage(content=query)]},stream_mode="messages")

    async for chunk in response:
        
        yield ServerSentEvent(
            id=chunk.get("id", str(uuid.uuid4())),
            event="messages",
            data=chunk)
