from langgraph.graph import StateGraph, START, END
from core.agent.state import KDBuildState, Allocation
from core.agent.nodes import (
    chunk_node,
    attention_node,
    atom_entity_node,
    dependence_entity_node,
    complete_node,
    allocation_router,
    cypher_node,
    loop_attention_router,
)

class KDBuildGraph:

    def build(self):
        kd_build_graph=StateGraph(KDBuildState)
        kd_build_graph.add_node(chunk_node)
        kd_build_graph.add_node(attention_node)
        kd_build_graph.add_node(atom_entity_node)
        kd_build_graph.add_node(dependence_entity_node)
        kd_build_graph.add_node(complete_node)
        kd_build_graph.add_node(cypher_node)

        kd_build_graph.add_edge(START,"chunk_node")
        kd_build_graph.add_edge("chunk_node","attention_node")
        kd_build_graph.add_conditional_edges("attention_node",loop_attention_router,
                                            {"attention_node":"attention_node",
                                            "atom_entity_node":"atom_entity_node",
                                            "dependence_entity_node":"dependence_entity_node"})
        kd_build_graph.add_edge(["atom_entity_node","dependence_entity_node"],"complete_node")
        kd_build_graph.add_edge("complete_node","cypher_node")
        kd_build_graph.add_edge("cypher_node",END)
        kd_build_agent=kd_build_graph.compile()
        send_build_graph=StateGraph(Allocation)
        send_build_graph.add_node("KD_build_node",kd_build_agent)
        send_build_graph.add_conditional_edges(START, allocation_router, {"KD_build_node": "KD_build_node"})
        send_build_graph.add_edge("KD_build_node", END)

        return send_build_graph.compile()

_kd_build_agent=KDBuildGraph().build()
