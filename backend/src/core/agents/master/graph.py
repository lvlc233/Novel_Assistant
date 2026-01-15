from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from core.agents.master.state import MasterState
from core.agents.master.prompts import MASTER_AGENT_SYSTEM_PROMPT
from common.utils import load_chat_model
from langchain_core.messages import SystemMessage

async def master_node(state: MasterState):
    model = load_chat_model("master_agent")
    # Prepend system prompt if not present? 
    # Usually system prompt is best handled by binding to model or ensuring it's in messages.
    # Here we just prepend it for simplicity in this node.
    messages = [SystemMessage(content=MASTER_AGENT_SYSTEM_PROMPT)] + state["messages"]
    response = await model.ainvoke(messages)
    return {"messages": [response]}

class MasterGraph:
    def build(self):
        graph = StateGraph(MasterState)
        graph.add_node("master", master_node)
        graph.add_edge(START, "master")
        graph.add_edge("master", END)
        
        return graph.compile(checkpointer=MemorySaver())

master_agent = MasterGraph().build()
