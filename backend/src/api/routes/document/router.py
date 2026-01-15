from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.document.schema import (
    DirectoryNodeResponse,
    DocumentDetailResponse,
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

from services.document.service import DocumentService
from infrastructure.pg.pg_client import get_session


router = APIRouter(prefix="/document", tags=["document"])

def get_document_service(session: AsyncSession = Depends(get_session)) -> DocumentService:
    return DocumentService(session)

@router.post("/create_folder")
async def create_folder4api(
    request: CreateFolderRequest, 
    service: DocumentService = Depends(get_document_service)
) -> Response[DirectoryNodeResponse]:
    """创建文件夹。"""
    
    folder = await service.create_folder(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_name=request.name
    )
 
    return Response.ok(data=folder)

# 删除文件夹(并移除联系)
@router.post("/delete_folder")
async def delete_folder4api(
    request: DeleteFolderRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[bool]:
    """删除文件夹(并移除联系)。"""
    await service.delete_folder(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_id=request.folder_id
    )
    return Response.ok(data=True)

# 重命名文件夹
@router.post("/rename_folder")
async def rename_folder4api(
    request: UpdateFolderRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[str]:
    """重命名文件夹。"""
    folder_new_name = await service.rename_folder(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_id=request.folder_id,
        folder_name=request.name
    )
    return Response.ok(data=folder_new_name)


# 更新文档内容(创建新版本)
@router.post("/update_document_content")
async def update_document_content4api(
    request: UpdateDocumentContentRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[str]:
    """更新文档内容(创建新版本)。"""
    version_id = await service.update_document_content(
        user_id=request.user_id, 
        document_id=request.document_id,
        content=request.content
    )
    return Response.ok(data=version_id)


# 创建文档。
@router.post("/create_document")
async def create_document4api(
    request: CreateDocumentRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[DirectoryNodeResponse]:
    """创建文档。"""
    document = await service.create_document(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        document_title=request.title, 
        folder_id=request.folder_id
    )
    return Response.ok(data=document)


# 更新文档
@router.post("/rename_document")
async def rename_document4api(
    request: UpdateDocumentRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[bool]:
    """更新文档。"""
    await service.rename_document(
        user_id=request.user_id, 
        document_id=request.document_id,
        document_title=request.title
    )
    return Response.ok(data=True)

# 参考章节详情(正文)
@router.post("/get_document_detail")
async def get_document_detail4api(
    request: GetDocumentDetailRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[DocumentDetailResponse]:
    """参考章节详情，返回该章节的详情。"""
    if request.version_id:
        detail = await service.get_document_detail_with_version(
            doc_id=request.document_id,
            version_id=request.version_id
        )
    else:
        detail = await service.get_document_detail(
            document_id=request.document_id
        )
    return Response.ok(data=detail)

# 查看章节版本列表
@router.post("/get_document_versions")
async def get_document_versions4api(
    request: GetDocumentVersionsRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[List[dict]]:
    """查看章节版本列表。"""
    versions = await service.get_document_versions(
        document_id=request.document_id
    )
    
    # Convert entities to dicts
    cleaned_data = []
    for v in versions:
        # Use .dict() if available (SQLModel) or __dict__
        d = v.dict() if hasattr(v, 'dict') else v.__dict__.copy()
        if "_sa_instance_state" in d:
            del d["_sa_instance_state"]
        cleaned_data.append(d)
        
    return Response.ok(data=cleaned_data)
    

# 删除章节(并移除联系)
@router.post("/delete_document")
async def delete_document4api(
    request: DeleteDocumentRequest,
    service: DocumentService = Depends(get_document_service)
) -> Response[bool]:
    """删除章节(并移除联系)，返还处理成功与否。"""
    await service.delete_document(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        document_id=request.document_id
    )
    return Response.ok(data=True)
