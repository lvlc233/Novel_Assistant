from datetime import datetime
from common.utils import create_uuid,get_now_time
from sqlmodel import Field, SQLModel, table
from sqlalchemy import TIMESTAMP
from typing import Literal


class DocumentMetadataSQLEntity(SQLModel, table=True):
    """
        文档.
    """
    __tablename__ = "document_metadata"

    document_id: str = Field(default_factory=lambda: create_uuid(), primary_key=True,description="文档ID")
    user_id: str = Field(description="用户ID", index=True)
    novel_id: str = Field(description="小说ID", index=True)
    folder_id: str|None = Field(default=None,description="文件夹ID:检索冗余", index=True)
    document_title: str = Field(default="未命名文档",description="文档标题")
    document_current_version_id: str = Field(description="当前版本")     
    document_update_time: datetime = Field(default_factory=lambda: get_now_time(),sa_type=TIMESTAMP(timezone=True),description="更新时间")  
    document_is_remove: bool = Field(default=False,description="是否删除")


class DocumentVersionSQLEntity(SQLModel, table=True):
    """
        文档版本.
    """
    __tablename__ = "document_version"

    document_version_id: str = Field(default_factory=lambda: create_uuid(), primary_key=True,description="版本ID")
    document_id: str = Field(description="文档ID", index=True)
    document_parent_version_id: str|None = Field(default=None,description="文档父版本ID")
    document_body_text: str = Field(default="",description="文档正文")
    document_create_time: datetime = Field(default_factory=lambda: get_now_time(),sa_type=TIMESTAMP(timezone=True),description="创建时间")

    document_word_count: int = Field(default=0,description="字数")

class NovelSQLEntity(SQLModel, table=True):
    """
        小说.
    """
    __tablename__ = "novel"

    novel_id: str = Field(default_factory=lambda: create_uuid(), primary_key=True,description="小说ID")
    user_id: str = Field(description="用户ID", index=True)
    novel_name: str = Field(default="未命名小说",description="小说名称")
    novel_cover_image_url: str = Field(default="",description="小说封面URL")
    novel_summary: str = Field(default="",description="小说描述")
    novel_state: str = Field(default="UPDATING",description="小说状态")
    novel_create_time: datetime = Field(default_factory=lambda: get_now_time(),sa_type=TIMESTAMP(timezone=True),description="创建时间")
    novel_update_time: datetime = Field(default_factory=lambda: get_now_time(),sa_type=TIMESTAMP(timezone=True),description="更新时间")
    novel_is_remove: bool = Field(default=False,description="是否删除")

class NovelKDMappingSQLEntity(SQLModel,table=True):
    """
        小说和知识库的映射表.
    """
    __tablename__ = "novel_kd_mapping"

    novel_id: str = Field(primary_key=True,description="小说ID")
    kd_id:str = Field(primary_key=True,description="知识库ID")

class KDSQLEntity(SQLModel,table=True):
    """
        知识库映射: 仅人类阅读和Agent兜底使用
    """
    __tablename__ = "kd"

    kd_id:str = Field(default_factory=lambda: create_uuid(), primary_key=True,description="小说ID")

class FolderSQLEntity(SQLModel, table=True):
    """
        文件夹.
    """
    __tablename__ = "folder"

    folder_id: str = Field(default_factory=lambda: create_uuid(), primary_key=True,description="文件夹ID")
    novel_id: str = Field(description="小说ID", index=True)
    folder_name: str = Field(default="未命名文件夹",description="文件夹名称")
    folder_create_time: datetime = Field(default_factory=lambda: get_now_time(),sa_type=TIMESTAMP(timezone=True),description="创建时间")

class TreeSortSQLEntity(SQLModel, table=True):
    """
        文件夹/文档排序.
    """
    __tablename__ = "tree_sort"

    tree_id: str = Field(default_factory=lambda: create_uuid(), primary_key=True,description="树ID")
    novel_id: str = Field(description="小说ID", index=True)
    parent_id: str|None = Field(default=None,description="父节点ID", index=True)
    node_type: str = Field(description="节点类型")
    node_id: str = Field(description="节点ID", index=True)
    node_sort_order: int = Field(default=0,description="排序,越小越靠前")




class UserSQLEntity(SQLModel, table=True):
    """
        用户.
    """
    __tablename__ = "user"

    user_id: str = Field(default_factory=lambda: create_uuid(), primary_key=True,description="用户ID")
    user_name: str = Field(default="未命名用户",description="用户名称", index=True)
    user_password: str = Field(description="密码")
