from langgraph.graph import StateGraph
from state import FacadeAgentState
from node import call_llm_node



graph=StateGraph(FacadeAgentState)
graph.add_node("llm",call_llm_node)
graph.set_entry_point("llm")
graph.set_finish_point("llm")
agent=graph.compile(name="Facade Agent")


from common.context import Context
from common.memory import SemanticMemory
from langchain_core.messages import HumanMessage, AIMessage

# 长期记忆
lt_mem = [
    SemanticMemory("用户是产品经理，正在做碳中和调研"),
    SemanticMemory("用户偏好 20 字以内简洁回答"),
]

# 工作记忆（会话级）
wk_mem = [
    SemanticMemory("已确定报告大纲：政策篇、技术篇、投资篇"),
]

# 短期记忆（多轮对话）
short = [
    HumanMessage("帮我起个报告标题"),
    AIMessage("《2025 碳中和路线图：政策、技术与投资全景》"),
    HumanMessage("再给我 3 个备选"),
]

# 知识库本次检索结果
kd = "【知识缓存】2025-04 中国出台碳中和 30 条新政，重点扶持氢能、储能、智能电网。"

# 组装 Context
ctx = Context(long_term_memory=lt_mem,
              work_memory=wk_mem,
              short_term_memory=short,
              knowledge_data=kd)

result=agent.invoke({"user_input":"你好","context":ctx})
print(result.get("context").short_term_memory[-1])
