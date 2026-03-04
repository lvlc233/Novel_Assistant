from typing import List, Optional
from core.plugin.annotations import plugin_meta, operation
from common.enums import PluginFromTypeEnum
from core.ui.layout import Editor, Mailbox

@plugin_meta(
    name="document_helper",
    space="official", 
    version="0.0.1",
    description="文档助手",
    from_type=PluginFromTypeEnum.SYSTEM,
    tags=["agent", "doc_agent"]
)
class DocumentHelperPlugin:
    
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
