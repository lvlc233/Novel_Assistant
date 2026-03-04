from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from common.config import settings
from core.plugin.di import Inject
from core.ui.home import Home
from core.plugin.annotations import plugin_meta, operation
from common.enums import PluginFromTypeEnum, UITrigger
from infrastructure.pg.pg_client import get_session

async def get_checkpoint() -> AsyncPostgresSaver:
    conn_string = settings.SQLALCHEMY_DATABASE_URI
    if "postgresql+asyncpg://" in conn_string:
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://")
    return AsyncPostgresSaver.from_conn_string(conn_string)

@plugin_meta(
    name="Agent管理器",
    space="system", 
    version="0.0.1",
    description="用于管理Agent的插件,主要是邮箱开启功能和消息会话管理统一入口",
    from_type=PluginFromTypeEnum.SYSTEM
)
class AgentManagerPlugin:
    
    @runtime_config
    def __init__(
        self,
        session: AsyncSession=Inject(get_session),
        checkpoint: PostgresSaver=Inject(get_checkpoint),
    ):
        self.session=session
        # self.agents = xxx,在这里使用sessin获取tag为agent的插件的信息并存储到插件中
    

    @operation(
        name="get_agent_info",
        description="获取Agent信息,用于在邮箱侧边栏显示",
        with_ui=[Home.EmailBoot.filter()],
        ui_target=Home.EmailBox,
        trigger = UITrigger.CLICK
    )
    async def get_agent_info(self):
        """获取Agent信息"""
        # 1. 获取插件中的agent信息
        # 2. 根据不同的checkpoint中的tag?中的agent_name=xxx来找到Agent的session_id和对话信息
        # 3. 封装为 List[AgentMessageHistoryItem]的字典并返回
        return 
    
    @operation(
        name="get_agent_info_in_card",
        description="获取Agent信息,在卡片信息中展示内容",
        with_ui=[Home.PluginExpand.PluginCard.filter(name="agent_manager")],
        ui_target=Home.PluginDetails.Info,
        trigger = UITrigger.CLICK
    )
    async def get_agent_info_in_card(self):
        """获取Agent信息"""
        # 1. 获取插件中的agent信息
        # 2. 根据不同的checkpoint中的tag?中的agent_name=xxx来找到Agent的session_id和对话信息
        # 3. 封装为 Home.PluginDetails.Info的字典并返回,其中type选择"AgentMessages",
        return 
    


    @operation(
    name="update_agent_email_state",
        description="更新插件中的Agent邮件状态(是否开启)",
        with_ui=[Home.PluginDetails.Info.filter(name="agent_manager")],
        trigger = UITrigger.CLICK
    )
    async def update_agent_email_state(self,agent_name:str,on_email:bool):
        # 但是现在似乎没有办法做到持久化,因为没有对应的表,插件系统也不兼容似乎,应该怎么做呢?
        return 

    @operation(
        name="proxy_send_agent_message",
        description="代理发送Agent消息",
        with_ui=[Home.EmailBox.AgentBox.filter()],
        trigger = UITrigger.ENTER
    )
    async def proxy_send_agent_message(self,agent_name:str,message:str,session_id:str):
        # 代理发送Agent消息并接受消息
       return 
        





