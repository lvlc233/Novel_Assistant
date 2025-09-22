"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing import Any, List
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, SystemMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.graph import MessagesState
from langgraph.prebuilt import ToolNode



async def chat_node(state):
    return {"messages": AIMessage(content="Hello, I am a copilot agent.")}
    

# Define the workflow graph
workflow = StateGraph(MessagesState)
workflow.add_node("chat_node", chat_node)
workflow.set_entry_point("chat_node")
graph = workflow.compile()
