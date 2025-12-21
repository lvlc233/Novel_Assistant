from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import (
    CreateDocumentRequest,
    DeleteDocumentRequest,
    SearchDocumentRequest,
    Response,
    CreateDocumentResponse, 
    SearchDocumentResponse,
    CreateFolderRequest,
    DeleteFolderRequest,
    UpdateFolderRequest,
    UpdateDocumentRequest,
    GetDocumentDetailRequest,
    MoveNodeRequest,
    FolderResponse,
    DocumentDetailResponse,
)
from common.clients.pg.pg_client import get_session


from common.adapter.novel import DocumentAdapter, FolderAdapter
from api.services.document_service import (
    create_document4service,
    delete_document4service,    
    search_documents_by_title4service,
    search_documents_by_content4service,
    create_folder4service,
    delete_folder4service,
    update_folder4service,
    get_document_detail4service,
    update_document4service,
    move_node4service,
)


router = APIRouter(tags=["document"])

@router.post("/create_document")
async def create_document4api(request: CreateDocumentRequest, session: AsyncSession = Depends(get_session))->Response[CreateDocumentResponse]:
    """创建文档。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        folder_id: str | None, # 文件夹ID
    Return:
        document: CreateDocumentResponse, # 文档项
            document_id: str, # 文档ID
            title: str, # 标题名
            current_version: str, # 当前版本
            document_version_list: List[str], # 文档版本列表
            body_text: str | None, # 文档内容
            create_time: str, # 创建时间
            update_time: str, # 更新时间
    """
    document_domain = await create_document4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_id=request.folder_id, 
        session=session)
    document = DocumentAdapter.from_domain(document_domain)
    return Response.ok(data=document)

@router.post("/delete_document")
async def delete_document4api(request: DeleteDocumentRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """删除文档。
    Args:
        document_id: str, # 文档ID
    Return:
        result: bool, # 是否删除成功
    """
    result = await delete_document4service(request.document_id, session)
    return Response.ok(data=result)

@router.post("/search_documents")
async def search_documents4api(request: SearchDocumentRequest, session: AsyncSession = Depends(get_session)) -> Response[List[SearchDocumentResponse]]:
    """搜索文档。
    Args:
        query: str, # 查询文本
        novel_id: str | None, # 小说ID，可选
        search_by_title: bool, # 是否根据标题搜索
        search_by_content: bool, # 是否根据正文搜索
        is_remove: bool, # 是否搜索已删除文档
    Return:
        response_data: List[SearchDocumentResponse], # 搜索结果列表
            doc_id: str, # 文档ID
            title: str, # 文档标题
            body_text: str | None, # 文档正文
    """
    results = {}
    # 并行执行搜索可能更好，但为了简单起见，这里按顺序执行
    if request.search_by_content:
        content_matches = await search_documents_by_content4service(request.is_remove, request.query, session, request.novel_id)
        for doc in content_matches:
            results[doc.doc_id] = doc
            
    if request.search_by_title:
        title_matches = await search_documents_by_title4service(request.is_remove, request.query, session, request.novel_id)
        for doc in title_matches:
            results[doc.doc_id] = doc
            

    response_data = [DocumentAdapter.from_domain_to_search(doc) for doc in results.values()]
    return Response.ok(data=response_data)




# 文件夹相关
@router.post("/create_folder")
async def create_folder4api(request: CreateFolderRequest, session: AsyncSession = Depends(get_session)) -> Response[FolderResponse]:
    """创建文件夹。
    Args:
        user_id: str, # 用户ID
        novel_id: str, # 小说ID
        name: str, # 文件夹名称
    Return:
        folder: FolderResponse, # 文件夹
            folder_id: str, # 文件夹ID
            name: str, # 文件夹名称
    """
    folder = await create_folder4service(request.user_id, request.novel_id, request.name, session)
    return Response.ok(data=FolderResponse(folder_id=folder.folder_id, name=folder.folder_name))

@router.post("/delete_folder")
async def delete_folder4api(request: DeleteFolderRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """删除文件夹。
    Args:
        folder_id: str, # 文件夹ID
    Return:
        result: bool, # 是否删除成功
    """
    result = await delete_folder4service(request.folder_id, session)
    return Response.ok(data=result)

@router.post("/update_folder")
async def update_folder4api(request: UpdateFolderRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """更新文件夹。
    Args:
        folder_id: str, # 文件夹ID
        name: str, # 文件夹名称
    Return:
        result: bool, # 是否更新成功
    """
    result = await update_folder4service(request.folder_id, request.name, session)
    return Response.ok(data=result)

@router.post("/get_document_detail")
async def get_document_detail4api(request: GetDocumentDetailRequest, session: AsyncSession = Depends(get_session)) -> Response[DocumentDetailResponse]:
    """获取文档详情。
    Args:
        document_id: str, # 文档ID
    Return:
        response: DocumentDetailResponse, # 文档详情
            document_id: str, # 文档ID
            title: str, # 文档标题
            body_text: str | None, # 文档内容
            current_version_id: str, # 当前版本ID
            update_time: str, # 更新时间
    """
    doc_domain = await get_document_detail4service(request.document_id, session)
    response = DocumentDetailResponse(
        document_id=doc_domain.doc_id,
        title=doc_domain.title,
        body_text=doc_domain.body_text,
        current_version_id=doc_domain.current_version_id,
        update_time=str(doc_domain.update_time)
    )
    return Response.ok(data=response)

@router.post("/update_document")
async def update_document4api(request: UpdateDocumentRequest, session: AsyncSession = Depends(get_session)) -> Response[DocumentDetailResponse]:
    """更新文档。
    Args:
        document_id: str, # 文档ID
        title: str | None, # 文档标题
        body_text: str | None, # 文档内容
    Return:
        response: DocumentDetailResponse, # 文档详情
            document_id: str, # 文档ID
            title: str, # 文档标题
            body_text: str | None, # 文档内容
            current_version_id: str, # 当前版本ID
            update_time: str, # 更新时间
    """
    doc_domain = await update_document4service(request.document_id, request.title, request.body_text, session)
    response = DocumentDetailResponse(
        document_id=doc_domain.doc_id,
        title=doc_domain.title,
        body_text=doc_domain.body_text,
        current_version_id=doc_domain.current_version_id,
        update_time=str(doc_domain.update_time)
    )
    return Response.ok(data=response)

@router.post("/move_node")
async def move_node4api(request: MoveNodeRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """移动节点。
    Args:
        node_id: str, # 节点ID
        target_parent_id: str | None, # 目标父节点ID（文件夹ID），为None表示根目录
        sort_order: int, # 排序位置
    Return:
        result: bool, # 是否移动成功
    """
    result = await move_node4service(request.node_id, request.target_parent_id, request.sort_order, session)
    return Response.ok(data=result)
