from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import (
    CreateNovelRequest, 
    GetNovelListRequest, 
    GetNovelDetailRequest,
    DeleteNovelRequest,
    UpdateNovelRequest,
    CreateDocumentRequest,
    DeleteDocumentRequest,
    SearchDocumentRequest,

    Response,
    NovelAbbreviateResponse,
    NovelDetailResponse,
    CreateDocumentResponse, 
    SearchDocumentResponse,

)
from common.clients.pg.pg_client import get_session


from common.adapter.novel import NovelAdapter, DocumentAdapter
from api.services.document_service import (
    create_novel4service,
    get_novel_existing_list4service,
    get_novel_detail4service,
    delete_novel4service,
    update_novel_info4service,
    create_document4service,
    delete_document4service,    
    search_documents_by_title4service,
    search_documents_by_content4service,
)

router = APIRouter(tags=["document"])

@router.get("/debug")
async def debug_router():
    return {"status": "document router registered", "message": "pong"}

@router.post("/create_novel")
async def create_novel(request: CreateNovelRequest, session: AsyncSession = Depends(get_session))->Response[str]:
    """创建小说"""
    
    novel_id = await create_novel4service(request.user_id, request.name, request.summary, session)
    return Response.ok(data=novel_id)



@router.post("/get_novels")
async def get_novels4api(request: GetNovelListRequest, session: AsyncSession = Depends(get_session))->Response[List[NovelAbbreviateResponse]]:
    """获取所有小说"""
    novels = await get_novel_existing_list4service(request.user_id, session)
    novels = [NovelAdapter.from_domain_abbreviate(novel) for novel in novels]
    return Response.ok(data=novels)

@router.post("/get_novel_detail")
async def get_novel_detail4api(request:GetNovelDetailRequest , session: AsyncSession = Depends(get_session))->Response[NovelDetailResponse]:
    """获取小说详情"""
    novel = await get_novel_detail4service(request.novel_id, session)
    novel = NovelAdapter.from_domain_detail(novel)
    return Response.ok(data=novel)

@router.post("/delete_novel")
async def delete_novel4api(request: DeleteNovelRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """删除小说"""
    result = await delete_novel4service(request.novel_id, session)
    return Response.ok(data=result)

@router.post("/update_novel_info")
async def update_novel_info4api(request: UpdateNovelRequest, session: AsyncSession = Depends(get_session)) -> Response[bool]:
    """修改小说信息"""
    result = await update_novel_info4service(request.novel_id, request.name, request.summary, session)
    return Response.ok(data=result)



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
