from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from core.agents.composition.state import CompositionState
from common.utils import load_chat_model

async def model_node(state: CompositionState):
    model = load_chat_model("composition_agent")
    messages = state["messages"]
    # Ensure system prompt or context is handled if needed
    response = await model.ainvoke(messages)
    return {"messages": [response], "agent_response": response}

class CompositionGraph:
    def build(self):
        graph = StateGraph(CompositionState)
        graph.add_node("agent", model_node)
        graph.add_edge(START, "agent")
        graph.add_edge("agent", END)
        
        return graph.compile(checkpointer=MemorySaver())

composition_agent = CompositionGraph().build()
