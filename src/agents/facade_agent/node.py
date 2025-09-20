from common.prompts import Facade_Agent_Prompt_Template
from common.model_loader import facade_agent_model
from state import (
    FacadeAgentState
)


from langchain_core.messages import HumanMessage,AIMessage

def call_llm_node(state: FacadeAgentState):
    context=state.context
    system_prompt_dict=context.to_system_prompt_dict()
    history=context.to_history_dict()
    user_input=state.user_input
    prompt=Facade_Agent_Prompt_Template().invoke({**system_prompt_dict,**history,**{"input":user_input}})
    response=facade_agent_model.invoke(prompt)
    context.short_term_memory.append([HumanMessage(content=user_input),AIMessage(content=response.content)])
    return {"context":context}

