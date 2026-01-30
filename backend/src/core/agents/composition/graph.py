from langgraph.graph import END, START, StateGraph

from common.config import settings
from common.utils import load_chat_model
from core.agents.composition.state import CompositionState
from infrastructure.langgraph.checkpointer import PostgresCheckpointer


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
        
        # Use PostgresCheckpointer
        conn_string = settings.SQLALCHEMY_DATABASE_URI
        if "postgresql+asyncpg://" in conn_string:
            conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
        
        checkpointer = PostgresCheckpointer(conn_string)
        return graph.compile(checkpointer=checkpointer)

composition_agent = CompositionGraph().build()
