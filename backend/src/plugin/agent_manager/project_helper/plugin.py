from typing import Dict, List, TypedDict

from langchain_core.messages import BaseMessageChunk
from langgraph.checkpoint.base import BaseCheckpointSaver

from common.model.base_agent import build_agent
from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum, RenderType
from core.plugin.annotations import plugin_meta, runtime_config, operation
from plugin.agent_manager.project_helper.agent.agent import graph



# Agent管理插件的作用如下：
# 1. 收集所有标记为[Agent]的已注册的插件,
# 2. 在管理插件则可以直接修改Agent的插件信息
# 3. 可以跳转到Agent的配置页面,进行详情查看
# 4. 代理发送消息到邮箱中
# 5. 收集所有Agent的插件的对话信息
@plugin_meta(
    name="project_helper",
    space="official", 
    version="0.0.1",
    description="项目助手",
    render_type=RenderType.AGENT_MESSAGES,
    from_type=PluginFromTypeEnum.OFFICIAL,
    scope_type=PluginScopeTypeEnum.GLOBAL,
    tags=["agent"]
)
class ProjectHelperPlugin:

    @runtime_config
    def __init__(self, 
                 base_url: str, 
                 api_key: str, 
                 model_name: str,
                 checkpoint: BaseCheckpointSaver):
        """
        插件初始化方法
        
        Args:
            base_url: 项目助手API基础URL
            api_key: 项目助手API密钥
            model_name: 项目助手模型名称
        """
        self.base_url = base_url
        self.api_key = api_key
        self.model_name = model_name
        self.checkpoint = checkpoint

    @operation
    async def call(self, query: str, page_id: str) -> BaseMessageChunk:
        """
        调用项目助手智能体
        
        Args:
            request: 用户发送的消息
            page_id: 页面ID
            
        yeild:
            项目助手智能体的响应流
        """

        

        agent = await build_agent(graph=graph, checkpoint=self.checkpoint)
        async for event in agent.astream(
            {"query": query,"page_id":page_id},config={"thread_id": page_id},
            stream_mode="messages",
            ):
            yield event
            


