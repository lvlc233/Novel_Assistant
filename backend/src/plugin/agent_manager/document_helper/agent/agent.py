from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

from plugin.agent_manager.document_helper.agent.schema import DocumentHelpAgentRuntime
from plugin.agent_manager.document_helper.agent.tools import build_document_helper_tools

DOCUMENT_HELPER_CHECKPOINTER = InMemorySaver()


async def build_agent(runtime_context: DocumentHelpAgentRuntime):
    llm = ChatOpenAI(
        model=runtime_context["model_name"],
        api_key=runtime_context["api_key"],
        base_url=runtime_context["base_url"],
        timeout=20.0,
        max_retries=0,
    )
    builtin_tools = build_document_helper_tools(
        document_content=runtime_context.get("document_content", ""),
        session=runtime_context["session"],
        document_title=runtime_context.get("document_title"),
        default_work_id=runtime_context.get("work_id"),
        default_document_id=runtime_context.get("document_id"),
        default_version_id=runtime_context.get("version_id"),
    )
    runtime_tools = list(runtime_context.get("tools", []))
    all_tools = [*builtin_tools, *runtime_tools]
    system_prompt = runtime_context.get("user_prompt") or "你是文档助手，优先使用工具读取或修改文档。"
    return create_agent(
        model=llm,
        tools=all_tools,
        system_prompt=system_prompt,
        checkpointer=DOCUMENT_HELPER_CHECKPOINTER,
        middleware=[
            HumanInTheLoopMiddleware(
                interrupt_on={
                    "patch_document_content": {
                        "allowed_decisions": ["approve", "edit", "reject"],
                        "description": "修改文档内容前需要人工审核",
                    },
                    "manage_outline": {
                        "allowed_decisions": ["approve", "edit", "reject"],
                        "description": "调整目录结构前需要人工审核",
                    },
                    "read_document_info": False,
                }
            )
        ],
    )
