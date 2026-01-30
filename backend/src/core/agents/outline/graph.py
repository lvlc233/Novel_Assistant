from langgraph.graph import END, START, StateGraph

from common.config import settings
from core.agents.outline.nodes import outline_node
from core.agents.outline.state import OutlineState
from infrastructure.langgraph.checkpointer import PostgresCheckpointer


class OutlineGraph:
    def build(self):
        graph = StateGraph(OutlineState)
        
        graph.add_node("outline_assistant", outline_node)
        
        graph.add_edge(START, "outline_assistant")
        graph.add_edge("outline_assistant", END)
        
        # Persistence
        conn_string = settings.SQLALCHEMY_DATABASE_URI
        if "postgresql+asyncpg://" in conn_string:
            conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
            
        checkpointer = PostgresCheckpointer(conn_string)
        
        return graph.compile(checkpointer=checkpointer)

outline_agent = OutlineGraph().build()
