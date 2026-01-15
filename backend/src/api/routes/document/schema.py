from typing import List
from pydantic import Field, BaseModel
from api.base import BaseRequest

class CreateDocumentRequest(BaseRequest):
    """创建文档请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    folder_id: str|None = Field(default=None, description="文件夹ID")
    title: str = Field(..., description="文档标题")

class UpdateDocumentContentRequest(BaseRequest):
    """更新文档内容请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    document_id: str = Field(..., description="文档ID")
    content: str = Field(..., description="文档内容")

class DeleteDocumentRequest(BaseRequest):
    """删除文档请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    document_id: str = Field(..., description="文档ID")

class UpdateDocumentRequest(BaseRequest):
    """更新文档请求"""
    user_id: str = Field(..., description="用户ID")
    document_id: str = Field(..., description="文档ID")
    title: str | None = Field(default=None, description="文档标题")
    body_text: str | None = Field(default=None, description="文档内容")

class GetDocumentDetailRequest(BaseRequest):
    """获取文档详情请求"""
    user_id: str = Field(..., description="用户ID")
    document_id: str = Field(..., description="文档ID")
    version_id: str | None = Field(default=None, description="版本ID")

class GetDocumentVersionsRequest(BaseRequest):
    """获取文档版本列表请求"""
    document_id: str = Field(..., description="文档ID")

class SearchDocumentRequest(BaseRequest):
    """搜索文档请求"""
    query: str = Field(..., description="查询文本")
    novel_id: str | None = Field(default=None, description="小说ID，可选")
    search_by_title: bool = Field(default=True, description="是否根据标题搜索")
    search_by_content: bool = Field(default=False, description="是否根据正文搜索")
    is_remove: bool = Field(default=False, description="是否搜索已删除文档")

class CreateFolderRequest(BaseRequest):
    """创建文件夹请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    name: str = Field(..., description="文件夹名称")
    
class DeleteFolderRequest(BaseRequest):
    """删除文件夹请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    folder_id: str = Field(..., description="文件夹ID")

class UpdateFolderRequest(BaseRequest):
    """更新文件夹请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    folder_id: str = Field(..., description="文件夹ID")
    name: str = Field(..., description="文件夹名称")

class MoveNodeRequest(BaseRequest):
    """移动节点请求"""
    node_id: str = Field(..., description="节点ID")
    target_parent_id: str | None = Field(default=None, description="目标父节点ID（文件夹ID），为None表示根目录")
    sort_order: int = Field(default=0, description="排序位置")

class DocumentDetailResponse(BaseModel):
    """指定版本的文档详情。
    """
    document_id: str = Field(description="文档ID")
    document_version_id: str = Field(description="版本ID")
    document_title: str = Field(description="文档标题")
    document_body_text: str | None = Field(default=None,description="文档内容")
    document_word_count: int = Field(default=0,description="字数")


class DirectoryNodeResponse(BaseModel):
    """目录节点（文件夹或文档）"""
    node_id: str = Field(description="节点ID")
    node_name: str = Field(description="节点名称")
    node_type: str = Field(description="节点类型: folder 或 document")
    sort_order: int = Field(description="排序顺序")
    children: List['DirectoryNodeResponse'] = Field(default=[], description="子节点列表")
    
    # 文档特有字段
    word_count: int | None = Field(default=None, description="字数")
    update_time: str | None = Field(default=None, description="更新时间")
    
    # 文件夹特有字段
    create_time: str | None = Field(default=None, description="创建时间")
