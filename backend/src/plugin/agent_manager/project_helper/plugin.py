from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from common.enums import UITrigger, PluginFromTypeEnum
from core.ui.home import Home, ProjectSessionData
from core.ui.layout import Mailbox
from common.config import settings
from common.model.base_agent import build_agent
from core.plugin.annotations import plugin_meta, runtime_config, operation
from core.plugin.di import Inject


from plugin.agent_manager.project_helper.agent.agent import graph
from plugin.agent_manager.project_helper.agent.schema import ProjectHelperAgentRuntime, ProjectHelperChatConfigRequest, ProjectHelperChatConfigResponse
from pydantic import BaseModel

class ProjectHelperChatConfigResponse(BaseModel):
    pass

class ProjectHelperChatConfigRequest(BaseModel):
    pass


from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.pg.pg_client import get_session


# def get_project_helper_service(
#     session: AsyncSession = Depends(get_session),
# ) -> ProjectHelperService:
#     return ProjectHelperService(session)
"""
感觉还可以加一个插件之间调度的方式,但是先看看,不着急
"""



async def get_checkpoint() -> AsyncPostgresSaver:
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    return AsyncPostgresSaver.from_conn_string(conn_string)

@plugin_meta(
    name="project_helper",
    space="official", 
    version="0.0.1",
    description="项目助手",
    from_type=PluginFromTypeEnum.SYSTEM,
    tags=["agent"]
)
class ProjectHelperPlugin:


    @runtime_config
    def __init__(self, 
                base_url: str = "https://api.openai.com/v1", 
                api_key: str = "", 
                model_name: str = "gpt-3.5-turbo",
                checkpoint: AsyncPostgresSaver = Inject(get_checkpoint),
                session:AsyncSession = Inject(get_session) 
            ):
        """
        插件初始化方法
        
        Args:
            base_url: 项目助手API基础URL
            api_key: 项目助手API密钥
            model_name: 项目助手模型名称
        """
        import os
        self.base_url = base_url or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model_name = model_name or "gpt-3.5-turbo"
        self.checkpoint = checkpoint
        self.session = session

    # @operation(
    #     name="quick_input_bottom",
    #     description="底部快速输入",
    #     ui_target=Home.Bottom.filter(),
    #     with_ui=["ProjectChatInput"]
    # )
    # async def quick_input_bottom(self):
    #     """底部快速输入"""
    #     pass

    @operation(
        name="agent_sidebar_item",
        description="邮箱侧边栏入口",
        ui_target=Mailbox.Sidebar.filter(),
        with_ui=["AgentSidebarItem"]
    )
    async def agent_sidebar_item(self, name: str = "项目助手", role: str = "Writing Assistant"):
        """邮箱侧边栏入口"""
        pass

    @operation(
        name="chat_input",
        description="项目助手输入框",
        ui_target=Home.Main.filter(),
        with_ui=["ProjectChatInput"]
    )
    async def chat_input(self):
        """项目助手输入框"""
        pass

    @operation(
        name="get_config",

        description="获取项目助手的配置",
        with_ui=[Home.PluginExpand.PluginCard.filter(name="project_helper")],
        ui_target=Home.PluginExpand.PluginCard.filter(name="project_helper"),
    )
    async def get_config(self) -> ProjectHelperChatConfigResponse:
        """
        获取项目助手的配置
        
        Returns:
            项目助手的配置响应模型
        """
        pass
    
    @operation(
        name="set_config",
        description="设置项目助手的配置",
        with_ui=[Home.PluginExpand.filter()],
        trigger = UITrigger.ENTER
    )
    async def set_config(self, request: ProjectHelperChatConfigRequest) -> None:
        """
        设置项目助手的配置
        
        Args:
            request: 项目助手的配置请求模型
        """
        
        # self.session.add(PluginSQLEntity(
        #     plugin_id="project_helper",
        #     page_id=request.page_id,
        #     config=request.config.model_dump()
        # ))
        # await self.session.commit()
    
    @operation(
        name="get_project_sessions",
        description="获取项目会话列表",
        ui_target=Home.PluginDetails.Info.filter()
    )
    async def get_project_sessions(self):
        """获取项目会话列表 (Mock Data)"""
        data: ProjectSessionData = {
            "pages": [
                {
                    "id": "page_1",
                    "name": "世界观设定",
                    "sessions": [
                        {
                            "id": "s_1",
                            "title": "关于魔法体系的初步构想",
                            "create_time": "2024-03-01 10:00",
                            "message_count": 5,
                            "tokens": 1200,
                            "messages": [
                                {"role": "user", "content": "帮我设计一个基于五行的魔法体系"},
                                {"role": "assistant", "content": "好的，我们可以从金木水火土五个基本元素出发，结合相生相克的原理..."}
                            ]
                        },
                        {
                            "id": "s_2",
                            "title": "反派势力背景",
                            "create_time": "2024-03-02 15:30",
                            "message_count": 8,
                            "tokens": 2400,
                            "messages": [
                                {"role": "user", "content": "反派组织叫'暗影议会'，他们的动机是什么？"},
                                {"role": "assistant", "content": "他们可能认为现有的秩序限制了人类的潜能，试图通过极端的手段打破平衡..."}
                            ]
                        }
                    ]
                },
                {
                    "id": "page_2",
                    "name": "第一章大纲",
                    "sessions": [
                             {
                                "id": "s_3",
                                "title": "开篇场景讨论",
                                "create_time": "2024-03-03 09:15",
                                "message_count": 12,
                                "tokens": 3100,
                                "messages": [
                                    {"role": "user", "content": "主角第一次出场应该是在哪里？"},
                                    {"role": "assistant", "content": "建议在一个充满冲突的环境中，比如热闹的集市或者危机四伏的森林边缘..."}
                                ]
                            }
                        ]
                }
            ]
        }
        return {
            "info_type": "ProjectSessionManager",
            "data": data
        }
    

    
    
    
    # async def get_registered_pages(self) -> ProjectHelperResourcesResponse:
    #     """
    #     获取页面的卡片信息
        
    #     Args:
    #         page_id: 页面ID
            
    #     Returns:
    #         页面的卡片信息字典
    #     """
    #     pass
    
    
    
    @operation(
        name="chat",
        description="调度ph_agent进行对话",
        with_ui=[Home.ProjectChatInput.filter(name="project_helper")],
        ui_target=Home.EmailBox.AgentBox.filter(name="project_helper"),
        trigger = UITrigger.ENTER
    )
    async def chat(self, message: str, session_id: str):
        """
        调用项目助手智能体
        
        Args:
            message: 用户发送的消息
            session_id: 会话ID (对应 page_id)
            
        yield:
            项目助手智能体的响应流
        """
        query = message
        page_id = session_id

        async with self.checkpoint as checkpointer:
            agent = await build_agent(graph=graph, checkpoint=checkpointer)
            
            # 配置项
            config = {
                "thread_id": page_id,
                "configurable": {
                    "model_name": self.model_name,
                    "base_url": self.base_url,
                    "api_key": self.api_key
                }
            }
            # runtime = ProjectHelperAgentRuntime(
            #     base_url=self.base_url,
            #     api_key=self.api_key,
            #     model_name=self.model_name,
            # )
            
            async for event in agent.astream(
                {"query": query, "page_id": page_id},
                config=config,
                # context=runtime, # 移除不支持的参数
                stream_mode="messages",
                ):
                # print("测试:"+str(event)) # Debug log
                # Handle tuple (message, metadata) from stream_mode="messages"
                if isinstance(event, tuple):
                    msg = event[0]
                    # metadata = event[1]
                    if hasattr(msg, "content"):
                        data = {"content": msg.content, "type": getattr(msg, "type", "message")}
                        if hasattr(msg, "id"):
                            data["id"] = msg.id
                        yield data
                        continue
                
                # Handle direct message object
                if hasattr(event, "content"):
                    # 提取主要内容
                    data = {"content": event.content, "type": getattr(event, "type", "message")}
                    if hasattr(event, "id"):
                        data["id"] = event.id
                    yield data
                elif isinstance(event, dict):
                    yield event
                else:
                    # 兜底：转字符串
                    yield {"type": "raw", "content": str(event)}
            
