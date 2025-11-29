from datetime import datetime
from uuid import uuid4
from venv import create
from sqlmodel import Field, SQLModel


class DocumentEntity(SQLModel, table=True):
    """
        文档.
    """
    __tablename__ = "document"

    doc_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True,description="文档ID")
    user_id: str = Field(description="用户ID")
    title: str = Field(default="未命名文档",description="文档标题")
    current_version_id: str = Field(default_factory=lambda: str(uuid4()),description="当前版本")  
    is_remove: bool = Field(default=False,description="是否删除")

class DocumentVersionEntity(SQLModel, table=True):
    """
        文档版本.
    """
    __tablename__ = "document_version"

    version_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True,description="版本ID")
    parent_version_id: str|None = Field(default_factory=lambda: str(uuid4()),description="父版本ID")
    doc_id: str = Field(description="文档ID")
    body_text: str|None = Field(default=None,description="正文")
    create_time: datetime = Field(default_factory=datetime.now,description="创建时间")
    update_time: datetime = Field(default_factory=datetime.now,description="更新时间")

class NovelEntity(SQLModel, table=True):
    """
        小说.
    """
    __tablename__ = "novel"

    novel_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True,description="小说ID")
    user_id: str = Field(description="用户ID")
    name: str = Field(default="未命名小说",description="小说名称")
    description: str = Field(default="",description="小说描述")
    create_time: datetime = Field(default_factory=datetime.now,description="创建时间")
    update_time: datetime = Field(default_factory=datetime.now,description="更新时间")
    is_remove: bool = Field(default=False,description="是否删除")

class FolderEntity(SQLModel, table=True):
    """
        文件夹.
    """
    __tablename__ = "folder"

    folder_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True,description="文件夹ID")
    novel_id: str = Field(description="小说ID")
    name: str = Field(default="未命名文件夹",description="文件夹名称")

class TreeSortEntity(SQLModel, table=True):
    """
        文件夹/文档排序.
    """
    __tablename__ = "tree_sort"

    tree_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True,description="树ID")
    novel_id: str = Field(description="小说ID")
    parent_id: str|None = Field(default=None,description="父节点ID")
    node_type: str = Field(description="节点类型")
    node_id: str = Field(description="节点ID")
    sort_order: int = Field(default=0,description="排序,越小越靠前")


class UserEntity(SQLModel, table=True):
    """
        用户.
    """
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True,description="用户ID")
    name: str = Field(default="未命名用户",description="用户名称")
    password: str = Field(description="密码")

