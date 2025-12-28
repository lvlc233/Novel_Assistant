from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from services.document_service import (
    create_folder4service, 
    delete_folder4service,
    rename_folder4service,
    create_document4service,
    get_document_detail4service,
    get_document_versions4service,
    delete_document4service,
    get_document_detail_use_document_id_and_version_id4service,
    rename_document4service,
    update_document_content4service
)
from core.domain.models import (
    DirectoryNode,
    DocumentDetailPinnedVersion
)
from api.models import (
    Response,
    CreateFolderRequest,
    DeleteFolderRequest,
    UpdateFolderRequest,
    CreateDocumentRequest,
    GetDocumentDetailRequest,
    GetDocumentVersionsRequest,
    DeleteDocumentRequest,
    UpdateDocumentContentRequest,
    UpdateDocumentRequest
)
from common.clients.pg.pg_client import get_session


router = APIRouter(tags=["document"])
@router.post("/create_folder")
async def create_folder4api(request: CreateFolderRequest, session: AsyncSession = Depends(get_session)) -> Response[DirectoryNode]:
    """创建文件夹。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        name: str, # 文件夹名
    """
    
    folder = await create_folder4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_name=request.name, 
        session=session)
 
    return Response.ok(data=folder)

# 删除文件夹(并移除联系)
@router.post("/delete_folder")
async def delete_folder4api(
    request: DeleteFolderRequest,
    session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """删除文件夹(并移除联系)。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        folder_id: str, # 文件夹ID
    """
    await delete_folder4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_id=request.folder_id,
        session=session)
    return Response.ok(data=True)

# 重命名文件夹
@router.post("/rename_folder")
async def rename_folder4api(
    request: UpdateFolderRequest,
    session: AsyncSession = Depends(get_session)) -> Response[str]:
    """重命名文件夹。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        folder_id: str, # 文件夹ID
        name: str, # 文件夹名
    """
    folder_new_name = await rename_folder4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_id=request.folder_id,
        folder_name=request.name,
        session=session)
    return Response.ok(data=folder_new_name)


# 更新文档内容(创建新版本)
@router.post("/update_document_content")
async def update_document_content4api(
    request: UpdateDocumentContentRequest,
    session: AsyncSession = Depends(get_session)) -> Response[str]:
    """更新文档内容(创建新版本)。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        document_id: str, # 文档ID
        content: str, # 文档内容
    """
    version_id = await update_document_content4service(
        user_id=request.user_id, 
        document_id=request.document_id,
        content=request.content,
        session=session)
    return Response.ok(data=version_id)


# 创建文档。
@router.post("/create_document")
async def create_document4api(
    request: CreateDocumentRequest,
    session: AsyncSession = Depends(get_session)) -> Response[DirectoryNode]:
    """创建文档。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        title: str, # 文档名
        folder_id: str|None = None, # 文件夹ID,若存在,表示在文件夹下,否则不是。
    """
    document = await create_document4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        document_title=request.title, 
        folder_id=request.folder_id,
        session=session)
    return Response.ok(data=document)


# 更新文档
@router.post("/rename_document")
async def rename_document4api(
    request: UpdateDocumentRequest,
    session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """更新文档。
    Args:
        user_id: str, # 用户ID
        document_id: str, # 文档ID
        title: str # 文档名
    """
    await rename_document4service(
        user_id=request.user_id, 
        document_id=request.document_id,
        document_title=request.title,
        session=session)
    return Response.ok(data=True)

# 参考章节详情(正文)
@router.post("/get_document_detail")
async def get_document_detail4api(
    request: GetDocumentDetailRequest,
    session: AsyncSession = Depends(get_session)) -> Response[DocumentDetailPinnedVersion]:
    """参考章节详情，返回该章节的详情。
    Args:
        document_id: str, # 文档ID
        version_id: str|None=None, # 文档版本ID,若存在,表示获取该版本的详情,否则表示获取当前版本的文档。
    """
    if request.version_id:
        detail = await get_document_detail_use_document_id_and_version_id4service(
            doc_id=request.document_id,
            version_id=request.version_id,
            session=session
        )
    else:
        detail = await get_document_detail4service(
            document_id=request.document_id,
            session=session
        )
    return Response.ok(data=detail)

# 查看章节版本列表
@router.post("/get_document_versions")
async def get_document_versions4api(
    request: GetDocumentVersionsRequest,
    session: AsyncSession = Depends(get_session)) -> Response[List[dict]]:
    """查看章节版本列表。
    Args:
        document_id: str, # 文档ID
    """
    versions = await get_document_versions4service(
        document_id=request.document_id,
        session=session)
    
    # Convert entities to dicts
    data = [v.dict() if hasattr(v, 'dict') else v.__dict__ for v in versions]
    # Filter out sqlalchemy internal state if needed, but __dict__ might include it.
    # Safe way is to use pydantic if available or manual dict.
    # Assuming SQLModel, .dict() works.
    # If using SQLAlchemy models directly, need manual conversion or remove _sa_instance_state.
    cleaned_data = []
    for v in versions:
        d = v.__dict__.copy()
        if "_sa_instance_state" in d:
            del d["_sa_instance_state"]
        cleaned_data.append(d)
        
    return Response.ok(data=cleaned_data)
    

# 删除章节(并移除联系)
@router.post("/delete_document")
async def delete_document4api(
    request: DeleteDocumentRequest,
    session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """删除章节(并移除联系)，返还处理成功与否。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        document_id: str, # 文档ID
    """
    await delete_document4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        document_id=request.document_id,
        session=session)
    return Response.ok(data=True)








