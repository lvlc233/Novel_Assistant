from typing import List, Optional
from core.plugin.annotations import plugin_meta, operation, runtime_config
from common.enums import PluginFromTypeEnum
from core.ui.layout import Editor, Mailbox
from pydantic import BaseModel

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
                base_url: str, 
                api_key: str, 
                model_name: str,
                user_prompt: str = ""):
        self.base_url = base_url
        self.api_key = api_key
        self.model_name = model_name
        self.user_prompt = user_prompt

    @operation(
        name="editor_assistant",
        description="文档助手侧边栏",
        ui_target=Editor.Sidebar.filter(),
        with_ui=["AIAssistant"]
    )
    async def editor_assistant(self):
        """文档助手侧边栏"""
        pass

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
