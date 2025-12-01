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

)
from common.clients.pg.pg_client import get_session


from common.adapter.novel import DocumentAdapter
from api.services.document_service import (
    create_document4service,
    delete_document4service,    
    search_documents_by_title4service,
    search_documents_by_content4service,
)


router = APIRouter(tags=["document"])

@router.post("/create_document")
async def create_document4api(request: CreateDocumentRequest, session: AsyncSession = Depends(get_session))->Response[CreateDocumentResponse]:
    """创建文档"""
    document_domain = await create_document4service(
        user_id=request.user_id, 
        novel_id=request.novel_id, 
        folder_id=request.folder_id, 
        session=session)
    document = DocumentAdapter.from_domain(document_domain)
    return Response.ok(data=document)

@router.post("/delete_document")
async def delete_document4api(request: DeleteDocumentRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """删除文档"""
    result = await delete_document4service(request.document_id, session)
    return Response.ok(data=result)

@router.post("/search_documents")
async def search_documents4api(request: SearchDocumentRequest, session: AsyncSession = Depends(get_session)) -> Response[List[SearchDocumentResponse]]:
    """搜索文档"""
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
