from langgraph.graph import StateGraph
from common.context import Context
from state import MapReduceAgentState,Input,Output
from node import map_docment_router,extract_info_llm_node,reduce_node


# Define the graph
graph = (
    StateGraph(MapReduceAgentState, input_schema=Input,output_schema=Output)
    .set_conditional_entry_point(map_docment_router,{"extract_info_llm_node":"extract_info_llm_node"})
    .add_node("extract_info_llm_node",extract_info_llm_node)
    .add_node("reduce_node",reduce_node)
    .add_edge("extract_info_llm_node","reduce_node")
    .set_finish_point("reduce_node")
)

agent=graph.compile(name="Prompt Recommendation Agent")

if __name__ == "__main__":

    import common.splitter as chapter_splitter

    splitter = chapter_splitter.ChapterTextSplitter()
    chunks = splitter.split_by_chapters(file_path)
    docs = splitter.to_docment(chunks)
    result = agent.invoke({"documents":docs})
    print(result)

