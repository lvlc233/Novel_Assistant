
from langchain.agents import create_agent

from common.utils import load_chat_model
from langgraph.graph.state import CompiledStateGraph


chat_helper: CompiledStateGraph=create_agent(
    model=load_chat_model(),
    tools=[],
    system_prompt="你是一个专业的小说助手,可以回答用户关于小说的问题.",
)   