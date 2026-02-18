# """KD Service Module."""
# from typing import List
# from uuid import UUID

# from sqlalchemy import delete, select
# from sqlalchemy.ext.asyncio import AsyncSession

# from api.routes.kd.schema import (
#     KDCreateRequest,
#     KDDescriptionCreateRequest,
#     KDDescriptionResponse,
#     KDDescriptionUpdateRequest,
#     KDMetaResponse,
#     KDUpdateRequest,
# )
# from common.errors import ResourceNotFoundError
# from infrastructure.pg.pg_models import KnowledgeBaseSQLEntity, KnowledgeChunkSQLEntity
# from common.model.base_plugin_models import InternalOperationBuilder
# from common.model.plugin_definition  import LoaderType,PluginDefinition
# from common.enums import LoaderType, PluginFromTypeEnum, PluginScopeTypeEnum, RenderType
# from core.plugin.register import PluginRegistry

# class KDSchema:
#     async def register_kd_plugin(session: AsyncSession):
#         registry = PluginRegistry(session)
#         kd_operation_builder = [
#             InternalOperationBuilder("kd:get_kd_list_by_work_id")
#             .param("work_id", "UUID", "作品ID", required=True)
#             .param("limit", "int", "返回数量", required=False, default=10),
#             InternalOperationBuilder("kd:get_kd_description_by_id")
#             .param("kd_id", "UUID", "知识库ID", required=True)
#             .param("limit", "int", "返回数量", required=False, default=10),
#             InternalOperationBuilder("kd:create_kd_description")
#             .param("kd_id", "UUID", "知识库ID", required=True)
#             .param("request", "KDDescriptionCreateRequest", "知识库描述创建请求", required=True),
#             InternalOperationBuilder("kd:update_kd_description")
#             .param("kd_id", "UUID", "知识库ID", required=True)
#             .param("request", "KDDescriptionUpdateRequest", "知识库描述更新请求", required=True),
#             InternalOperationBuilder("kd:delete_kd_description")
#             .param("kd_id", "UUID", "知识库ID", required=True),
#         ]
#         kd_chunk_operation_builder = [
#             InternalOperationBuilder("kd:get_kd_chunk_list_by_kd_id")
#             .param("kd_id", "UUID", "知识库ID", required=True)
#             .param("limit", "int", "返回数量", required=False, default=10),
#             InternalOperationBuilder("kd:get_kd_chunk_by_id")
#             .param("kd_chunk_id", "UUID", "知识库片段ID", required=True)
#             .param("limit", "int", "返回数量", required=False, default=10),
#             InternalOperationBuilder("kd:create_kd_chunk")
#             .param("kd_id", "UUID", "知识库ID", required=True)
#             .param("request", "KnowledgeChunkCreateRequest", "知识库片段创建请求", required=True),
#             InternalOperationBuilder("kd:update_kd_chunk")
#             .param("kd_chunk_id", "UUID", "知识库片段ID", required=True)
#             .param("request", "KnowledgeChunkUpdateRequest", "知识库片段更新请求", required=True),
#             InternalOperationBuilder("kd:delete_kd_chunk")
#             .param("kd_chunk_id", "UUID", "知识库片段ID", required=True),
#         ]

#         # 使用确定性ID创建插件定义
#         plugin_def = PluginDefinition.with_deterministic_id(
#             source_namespace="official",          # ID生成命名空间
#             plugin_name="kd_plugin",           # 插件名称
#             loader_type=LoaderType.INTERNAL,       # 加载器类型
#             operation_builders=kd_operation_builder + kd_chunk_operation_builder,  # 操作列表
#             # 元数据配置
#             from_type=PluginFromTypeEnum.SYSTEM,   # 系统内置插件
#             scope_type=PluginScopeTypeEnum.WORK, # 作品作用域
#             # runtime_config={"max_memories": 1000}, # 运行时配置
#             # default_config={},                     # 默认配置
#             render_type=RenderType.CARD,           # 渲染类型
#             tags=["kd", "tool", "work"]      # 功能标签
#         )
#         try:
#             plugin_id = await registry.register_with_deterministic_id(plugin_def)
            
#             print(f"✅ KD plugin registered with ID: {plugin_id}")
#             return plugin_id
            
#         except Exception as e:
#             print(f"❌ Failed to register KD plugin: {e}")
#             errors = registry.get_errors()
#             for error in errors:
#                 print(f"Error: {error}")
#             raise


# class KDService:
#     """KD Service Class."""
#     def __init__(self, session: AsyncSession):
#         """Initialize KDService."""
#         self.session = session

   