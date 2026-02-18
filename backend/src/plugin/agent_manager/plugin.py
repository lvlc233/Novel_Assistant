# from core.plugin.annotations import plugin_meta, runtime_config, operation
# from common.enums import PluginFromTypeEnum, PluginScopeTypeEnum, LoaderType, RenderType

# @plugin_meta(
#     name="agent_manager",
#     space="official", 
#     version="0.0.1",
#     description="管理Agent的插件",
#     render_type=RenderType.CARD,
#     from_type=PluginFromTypeEnum.SYSTEM,
#     scope_type=PluginScopeTypeEnum.GLOBAL,
#     tags=["agent"]
# )
# class AgentManagerPlugin:

#     @runtime_config
#     def __init__(self, 
#                  database_url: str, 
#                  max_connections: int = 10, 
#                  timeout: float = 30.0,
#                  enabled: bool = True):
#         """
#         插件初始化方法
        
#         Args:
#             database_url: 数据库连接URL
#             max_connections: 最大连接数
#             timeout: 超时时间(秒)
#             enabled: 是否启用插件
#         """

#     # async def get_current_agent(self) -> Optional[Dict[str, Any]]:
#     #     """
#     #     获取当前运行中的智能体
        
#     #     Returns:
#     #         当前智能体的字典表示，如果没有运行中的智能体则返回None
#     #     """
#     @operation
#     async def send_message_to_email(self, email: str, message: str) -> bool:
#         """
#         向指定邮箱发送消息
        
#         Args:
#             email: 目标邮箱地址
#             message: 要发送的消息内容
            
#         Returns:
#             如果消息发送成功则返回True，否则返回False
#         """
