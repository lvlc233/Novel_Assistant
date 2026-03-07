from typing import List, Optional, Annotated
from core.plugin.annotations import plugin_meta, operation, runtime_config, UIParamSourceEnum, UITrigger
from common.enums import PluginFromTypeEnum
from core.ui.layout import Editor, Mailbox
from core.ui.home import Home, DocumentSessionData
from core.ui.base import Component
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, SystemMessage
from common.utils.utils import load_chat_model_with_env

class Assistant(Component):
    def __init__(self, title: str = "Document Assistant"):
        self.title = title

class DocumentHelperChatConfigResponse(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

class DocumentHelperChatConfigRequest(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

@plugin_meta(
    name="document_helper",
    space="official", 
    version="0.0.1",
    description="文档助手",
    from_type=PluginFromTypeEnum.SYSTEM,
    tags=["agent", "doc_agent"]
)
class DocumentHelperPlugin:
    
    @runtime_config
    def __init__(self, 
                base_url: str = "https://api.openai.com/v1", 
                api_key: str = "", 
                model_name: str = "gpt-3.5-turbo",
                user_prompt: str = ""):
        import os
        self.base_url = base_url or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model_name = model_name or "gpt-3.5-turbo"
        self.user_prompt = user_prompt

    @operation(
        name="editor_assistant",
        description="文档助手侧边栏",
        ui_target=Editor.Sidebar.filter(),
        with_ui=["AIAssistant"]
    )
    async def editor_assistant(self):
        """文档助手侧边栏"""
        return {"title": "AI Assistant"}

    @operation(
        name="chat",
        description="与文档对话",
        with_ui=[Assistant.filter()],
        ui_target=Assistant, # This might need a specific slot for messages or stream back to component
        trigger=UITrigger.ENTER
    )
    async def chat(
        self, 
        message: str, 
        document_content: Annotated[str, UIParamSourceEnum.CONTEXT, "document_content"] = ""
    ):
        """与文档内容对话"""
        model = load_chat_model_with_env("document_helper")
        
        system_prompt = self.user_prompt or "You are a helpful document assistant."
        if document_content:
            system_prompt += f"\n\nContext from document:\n{document_content}"
            
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message)
        ]
        
        async for chunk in model.astream(messages):
            if hasattr(chunk, "content"):
                yield {"content": chunk.content, "type": "message"}

    @operation(
        name="agent_sidebar_item",
        description="邮箱侧边栏入口",
        ui_target=Mailbox.Sidebar.filter(),
        with_ui=["AgentSidebarItem"]
    )
    async def agent_sidebar_item(self, name: str = "文档助手", role: str = "Editor"):
        """邮箱侧边栏入口"""
        pass

    @operation(name="get_config")
    async def get_config(self) -> DocumentHelperChatConfigResponse:
        """获取文档创作Chat助手的配置."""
        return DocumentHelperChatConfigResponse(
            model_name=self.model_name,
            base_url=self.base_url,
            api_key=self.api_key,
            user_prompt=self.user_prompt
        )

    @operation(name="update_config")
    async def update_config(self, request: DocumentHelperChatConfigRequest) -> None:
        """修改文档创作Chat助手的配置."""
        # 配置更新逻辑通常由框架层处理，这里可能需要持久化到数据库
        # 或者仅仅作为运行时配置的更新
        pass

    @operation(
        name="get_document_sessions",
        description="获取文档会话列表",
        ui_target=Home.PluginDetails.Info.filter()
    )
    async def get_document_sessions(self):
        """获取文档会话列表 (Mock Data)"""
        data: DocumentSessionData = {
            "documents": [
                {
                    "id": "doc_1",
                    "title": "第一章：初识",
                    "sessions": [
                        {
                            "id": "ds_1",
                            "title": "润色第一段",
                            "create_time": "2024-03-02 14:30",
                            "message_count": 3,
                            "tokens": 500,
                            "messages": [
                                {"role": "user", "content": "这一段描写有点平淡，帮我润色一下"},
                                {"role": "assistant", "content": "建议增加一些环境描写，例如：晨曦微露，雾气在山间缭绕..."}
                            ]
                        }
                    ]
                },
                {
                    "id": "doc_2",
                    "title": "人物小传：亚瑟",
                    "sessions": [
                        {
                            "id": "ds_2",
                            "title": "性格分析",
                            "create_time": "2024-03-04 11:20",
                            "message_count": 6,
                            "tokens": 800,
                            "messages": [
                                {"role": "user", "content": "亚瑟这个角色会不会太过于理想化？"},
                                {"role": "assistant", "content": "确实有点，我们可以给他增加一些缺点，比如优柔寡断或者固执己见..."}
                            ]
                        }
                    ]
                }
            ]
        }
        return {
            "info_type": "DocumentSessionManager",
            "data": data
        }
