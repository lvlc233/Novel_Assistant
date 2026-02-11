"""PostgreSQL Models Module."""
from datetime import datetime
from typing import Dict, List
from uuid import UUID

from sqlalchemy import JSON, TIMESTAMP, Column
from sqlmodel import Field, Relationship, SQLModel

from common.enums import (
    NodeTypeEnum,
    PluginFromTypeEnum,
    PluginScopeTypeEnum,
    WorkTypeEnum,
    WorkStateEnum,
    MemoryTypeEnum
    
)
from common.utils import create_uuid, get_now_time

# --- 7.1 Core & Plugin ---

class PluginSQLEntity(SQLModel, table=True):
    """插件注册表: 定义系统中所有可用的插件（能力）。."""
    __tablename__ = "plugin"

    id: UUID = Field(default_factory=create_uuid, primary_key=True, description="插件ID")
    name: str = Field(index=True, unique=True, description="插件名称")
    description: str | None = Field(default=None, description="插件描述")
    
    # 插件类型与作用域
    from_type: PluginFromTypeEnum = Field(default=PluginFromTypeEnum.SYSTEM, description="来源: system(系统内置), custom(用户自定义)")
    scope_type: PluginScopeTypeEnum = Field(default=PluginScopeTypeEnum.WORK, description="作用域: global(全局), work(作品级), document(文档级)")
    
    # 全局开关
    enabled: bool = Field(default=True, description="全局启用状态")
    
    # 配置定义 (Schema) 与 默认配置
    config_schema: Dict = Field(default={}, sa_column=Column(JSON), description="配置Schema定义")
    default_config: Dict = Field(default={}, sa_column=Column(JSON), description="默认配置值")
    
    tags: List[str] = Field(default=[], sa_column=Column(JSON), description="标签列表")

    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    # Relationships
    work_mappings: List["WorkPluginMappingSQLEntity"] = Relationship(back_populates="plugin")


class WorkSQLEntity(SQLModel, table=True):
    """作品表: 项目的核心实体（如一本小说）。."""
    __tablename__ = "work"

    id: UUID = Field(default_factory=create_uuid, primary_key=True, description="作品ID")
    # user_id removed

    name: str = Field(default="未命名作品", description="作品名称")
    cover_image_url: str | None = Field(default=None, description="封面图片URL")
    summary: str | None = Field(default=None, description="作品简介")
    
    # 作品类型，对应某种 WorkType 插件的标识
    work_type: WorkTypeEnum = Field(default=WorkTypeEnum.NOVEL, description="作品类型标识")
    
    state: WorkStateEnum = Field(default=WorkStateEnum.UPDATING, description="状态: updating, completed")
    
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))

    # Relationships
    plugin_mappings: List["WorkPluginMappingSQLEntity"] = Relationship(back_populates="work")
    nodes: List["NodeSQLEntity"] = Relationship(back_populates="work")


class WorkPluginMappingSQLEntity(SQLModel, table=True):
    """作品-插件关联表: 记录某个作品启用了哪些插件，以及特定的配置。."""
    __tablename__ = "work_plugin_mapping"

    id: UUID = Field(default_factory=create_uuid, primary_key=True)
    
    work_id: UUID = Field(foreign_key="work.id", index=True)
    plugin_id: UUID = Field(foreign_key="plugin.id", index=True)
    
    # 该作品下是否启用
    enabled: bool = Field(default=True)
    
    # 实例配置: 覆盖 Plugin 的 default_config
    config: Dict = Field(default={}, sa_column=Column(JSON), description="作品级配置覆盖")
    
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    # Relationships
    work: WorkSQLEntity = Relationship(back_populates="plugin_mappings")
    plugin: PluginSQLEntity = Relationship(back_populates="work_mappings")


# --- 7.2 Agent管理 ---

class AgentsManagerSQLEntity(SQLModel, table=True):
    """agent的管理模块."""
    __tablename__ = "agents_manager"   

    id: UUID = Field(default_factory=create_uuid, primary_key=True, description="agent的id")    
    name: str = Field(description="agent的名称")
    description: str | None = Field(default=None, description="agent的描述")
    context_size : int = Field(default=-1, description="表示上下文的大小,单位token,若写入 -1 表示不做任何限制,因此也不会进行总结。0表示这个Agent没有历史记录的概念") # 表示上下文的大小,单位token,若写入 -1 表示不做任何限制,因此也不会进行总结。0表示这个Agent没有历史记录的概念
    is_summary: bool = Field(default=False, description="表示是否对上下文进行总结,在超出了上面的上下文大小之后") # 表示是否对上下文进行总结,在超出了上面的上下文大小之后
    enabled: bool = Field(default=True, description="表示是否启用这个Agent")
    broadcast: bool = Field(default=False, description="表示是否广播这个Agent的所有消息")
    sessions: List[str] = Field(default=[], sa_column=Column(JSON), description="历史会话ID列表")
    config: Dict = Field(default={}, sa_column=Column(JSON), description="agent的配置")
    
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))


class WorkTypeSQLEntity(SQLModel, table=True):
    """作品类型表."""
    __tablename__ = "work_type"

    id: UUID = Field(default_factory=create_uuid, primary_key=True)
    name: str = Field(unique=True, index=True)
    enabled: bool = Field(default=True)
    
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    relationship: List[str] = Field(default=[], sa_column=Column(JSON))
    configurable: bool = Field(default=False)
    
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
# --- 7.3 内容与结构 (Content & Graph) ---

class NodeSQLEntity(SQLModel, table=True):
    """节点表: 构成作品内容的原子单位（文档、文件夹、白板等）。."""
    __tablename__ = "node"

    id: UUID = Field(default_factory=create_uuid, primary_key=True, description="节点ID")
    work_id: UUID = Field(foreign_key="work.id", index=True)
    
    name: str = Field(default="未命名节点")
    description: str | None = Field(default=None, description="节点描述")
    node_type: NodeTypeEnum = Field(description="类型: document, folder, whiteboard...")
    
    now_version: str | None = Field(default=None, description="当前版本ID")

    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))

    # Relationships
    work: WorkSQLEntity = Relationship(back_populates="nodes")
    # versions: List["DocumentVersionSQLEntity"] = Relationship(back_populates="node") # Circular dependency issue if not careful, omitted for brevity


class NodeRelationshipSQLEntity(SQLModel, table=True):
    """节点关系表: 定义节点之间的关系（层级关系、引用、链接）。."""
    __tablename__ = "node_relationship"

    id: UUID = Field(default_factory=create_uuid, primary_key=True)
    work_id: UUID = Field(foreign_key="work.id", index=True)
    
    from_node_id: UUID = Field(foreign_key="node.id", index=True)
    to_node_id: UUID = Field(foreign_key="node.id", index=True)
    
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))


class DocumentVersionSQLEntity(SQLModel, table=True):
    """文档版本表: 存储 Node (类型为 document) 的实际内容历史。."""
    __tablename__ = "document_version"

    id: UUID = Field(default_factory=create_uuid, primary_key=True)
    node_id: UUID = Field(foreign_key="node.id", index=True)
    
    version: str = Field(default=1, description="版本号")

    full_text: str = Field(default="", description="文档内容 (HTML/JSON/Markdown)")
    word_count: int = Field(default=0)
    
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True)) 


# --- 7.4 知识库(Knowledge)(插件) ---

class KnowledgeBaseSQLEntity(SQLModel, table=True):
    """知识库元数据表."""
    __tablename__ = "knowledge_base"
    
    id: UUID = Field(default_factory=create_uuid, primary_key=True)
    work_id: UUID | None = Field(default=None, index=True, description="关联作品ID，空则为全局")
    title: str = Field(default="未命名知识库")
    description: str | None = None
    enabled: bool = Field(default=True, description="是否启用知识库")
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))


class KnowledgeChunkSQLEntity(SQLModel, table=True):
    __tablename__ = "knowledge_chunk"
    
    id: UUID = Field(default_factory=create_uuid, primary_key=True)
    kb_id: UUID = Field(foreign_key="knowledge_base.id", index=True)    
    
    content: str = Field(description="文本内容")
    search_keys: List[str] = Field(default=[], sa_column=Column(JSON), description="搜索关键词列表")
    enabled:bool = Field(default=True, description="该知识点是否启用")
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
# --- 7.5 记忆库(Memory)(插件) ---

class MemorySQLEntity(SQLModel, table=True):
    """记忆表."""
    __tablename__ = "memory" # Fixed table name from knowledge_base copy-paste error in doc
    
    id: UUID = Field(default_factory=create_uuid, primary_key=True)
    work_id: UUID | None = Field(default=None, index=True, description="关联作品ID，空则为全局")
    name: str = Field(default="未命名记忆库")
    description: str | None = None
    enabled: bool = Field(default=True, description="是否启用记忆库")
    type: MemoryTypeEnum = Field(description="记忆类型")
    context: str
    create_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True))
    update_at: datetime = Field(default_factory=get_now_time, sa_type=TIMESTAMP(timezone=True)) 
