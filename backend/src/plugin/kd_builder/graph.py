from langgraph.graph import END, START, StateGraph

from core.agents.kd_builder.nodes import (
    allocation_router,
    atom_entity_node,
    attention_node,
    chunk_node,
    complete_node,
    cypher_node,
    dependence_entity_node,
    loop_attention_router,
)
from core.agents.kd_builder.state import Allocation, KDBuildState


class KDBuildGraph:

    def build(self):
        kd_build_graph = StateGraph(KDBuildState)
        kd_build_graph.add_node("chunk_node", chunk_node)
        kd_build_graph.add_node("attention_node", attention_node)
        kd_build_graph.add_node("atom_entity_node", atom_entity_node)
        kd_build_graph.add_node("dependence_entity_node", dependence_entity_node)
        kd_build_graph.add_node("complete_node", complete_node)
        kd_build_graph.add_node("cypher_node", cypher_node)

        kd_build_graph.add_edge(START, "chunk_node")
        kd_build_graph.add_edge("chunk_node", "attention_node")
        
        # Conditional edge for loop or branch
        # Note: loop_attention_router returns "attention_node" (str) or ["atom_entity_node", "dependence_entity_node"] (list)
        kd_build_graph.add_conditional_edges(
            "attention_node",
            loop_attention_router,
            [
                "attention_node",
                "atom_entity_node",
                "dependence_entity_node"
            ]
        )
        
        kd_build_graph.add_edge(["atom_entity_node", "dependence_entity_node"], "complete_node")
        kd_build_graph.add_edge("complete_node", "cypher_node")
        kd_build_graph.add_edge("cypher_node", END)
        
        kd_build_agent = kd_build_graph.compile()
        
        send_build_graph = StateGraph(Allocation)
        send_build_graph.add_node("KD_build_node", kd_build_agent)
        
        # map-reduce using Send
        send_build_graph.add_conditional_edges(START, allocation_router, ["KD_build_node"])
        send_build_graph.add_edge("KD_build_node", END)

        return send_build_graph.compile()

# Export the compiled graph
kd_build_agent = KDBuildGraph().build()
