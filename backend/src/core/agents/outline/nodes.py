from langchain_core.messages import SystemMessage

from common.utils import load_chat_model
from core.agents.outline.prompts import OUTLINE_AGENT_SYSTEM_PROMPT
from core.agents.outline.state import OutlineState


async def outline_node(state: OutlineState):
    """Core node for the Outline Agent.
    Invokes the LLM with the system prompt and conversation history.
    """
    model = load_chat_model("outline_agent")
    
    # Ensure system prompt is present
    # In a more complex setup, we might check if it's already there or bind it.
    # For now, we construct the messages list.
    
    messages = [SystemMessage(content=OUTLINE_AGENT_SYSTEM_PROMPT)] + state["messages"]
    
    response = await model.ainvoke(messages)
    
    return {"messages": [response]}
