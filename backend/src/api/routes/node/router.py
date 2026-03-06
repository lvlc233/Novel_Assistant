from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.base import Response
from api.routes.node.schema import (
    CreateNodeDTO,
    DocumentCreateRequest,
    DocumentDetailResponse,
    DocumentResponse,
    DocumentUploadRequest,
    DocumentVersionUploadRequest,
    DocumentVersionCreateRequest,
    DocumentVersionResponse,
    NodeCreateRequest,
    NodeResponse,
    NodeUpdateRequest,
    # RelationshipResponse,
    UpdateNodeDTO,
)
from common.enums import NodeTypeEnum
from infrastructure.pg.pg_client import get_session
from services.node.service import NodeService
# from services.work.service import WorkService

router = APIRouter(tags=["nodes"])

def get_node_service(session: AsyncSession = Depends(get_session)) -> NodeService:
    return NodeService(session)

# def get_work_service(session: AsyncSession = Depends(get_session)) -> WorkService:
#     return WorkService(session)

# --- Documents ---

# 开发者: BackendAgent(python)
# 当前版本: BE-DEP-20260224-04
# 创建时间: 2026-02-24 00:22
# 更新时间: 2026-02-24 00:22
# 更新记录:
#     [2026-02-24 00:22:BE-DEP-20260224-04: 注释掉未使用的文档直连接口，避免绕过作品上下文。]
# 注释者: BackendAgent(python)
# 时间: 2026-02-24 00:22
# 使用位置: 后端路由 /document/{document_id} (前端未调用)
# 实现概述: 注释掉不依赖 Work 的文档详情接口，统一走 /work/{work_id}/document/{document_id}。
# 废弃标记: 已废弃
# @router.get("/document/{document_id}", response_model=Response[DocumentDetailResponse])
# async def get_document_detail_by_id(
#     document_id: str,
#     service: NodeService = Depends(get_node_service)
# ) -> Response[DocumentDetailResponse]:
#     """根据ID直接获取文档详情 (用于编辑器等不依赖Work上下文的场景)."""
#     data = await service.get_document_detail_by_id(document_id)
#     return Response.ok(data=data)

@router.post("/work/{work_id}/document", response_model=Response[DocumentResponse])
async def create_document(
    work_id: str,
    request: DocumentCreateRequest,
    service: NodeService = Depends(get_node_service)
) -> Response[DocumentResponse]:
    """创建文档."""
    req = CreateNodeDTO(
        name=request.title,
        description=request.description,
        type=NodeTypeEnum.DOCUMENT,
        parent_node_id=request.from_node_id
    )
    data = await service.create_node(work_id, req)
    
    return Response.ok(data=DocumentResponse(
        id=data.id,
        title=data.name,
        description=data.description,
        from_node_id=data.parent_node_id
    ))

@router.delete("/work/{work_id}/document/{document_id}", response_model=Response[None])
async def delete_document(
    work_id: str,
    document_id: str,
    service: NodeService = Depends(get_node_service)
) -> Response[None]:
    """删除文档."""
    await service.delete_node(document_id)
    return Response.ok()

@router.patch("/work/{work_id}/document/{document_id}", response_model=Response[None])
async def update_document(
    work_id: str,
    document_id: str,
    request: DocumentUploadRequest,
    service: NodeService = Depends(get_node_service)
) -> Response[None]:
    """更新文档基础信息 (Title, Description, Parent)."""
    req = UpdateNodeDTO(
        name=request.title,
        description=request.description,
        parent_node_id=request.from_node_id
    )
    await service.update_node(document_id, req)
    return Response.ok()

@router.get("/work/{work_id}/document/{document_id}/version", response_model=Response[DocumentVersionResponse])
async def get_document_versions(
    work_id: str,
    document_id: str,
    service: NodeService = Depends(get_node_service)
) -> Response[DocumentVersionResponse]:
    """获取指定文档的所有版本."""
    data = await service.get_document_versions(document_id)
    return Response.ok(data=data)

@router.get("/work/{work_id}/document/{document_id}/version/{version_id}", response_model=Response[DocumentDetailResponse])
async def get_document_version_detail(
    work_id: str,
    document_id: str,
    version_id: str,
    service: NodeService = Depends(get_node_service)
) -> Response[DocumentDetailResponse]:
    """获取指定文档的指定版本的详情,并切换当前的版本为指定version的版本."""
    data = await service.get_document_version_detail_and_switch(document_id, version_id)
    return Response.ok(data=DocumentDetailResponse(
        id=data.id,
        work_id=data.work_id,
        title=data.title,
        description=data.description,
        from_node_id=data.from_node_id,
        full_text=data.full_text,
        now_version=data.now_version,
        now_version_id=data.now_version_id # Map service current_version_id to response now_version_id
    ))

@router.post("/work/{work_id}/document/{document_id}/version", response_model=Response[None])
async def create_document_version(
    work_id: str,
    document_id: str,
    request: DocumentVersionCreateRequest,
    service: NodeService = Depends(get_node_service)
) -> Response[None]:
    """创建文档的新版本,并将最新的版本指定为该版本,新版本继承自当前版本的内容."""
    await service.create_document_version(document_id, request)
    return Response.ok()

@router.delete("/work/{work_id}/document/{document_id}/version/{version_id}", response_model=Response[None])
async def delete_document_version(
    work_id: str,
    document_id: str,
    version_id: str,
    service: NodeService = Depends(get_node_service)
) -> Response[None]:
    """删除指定版本."""
    await service.delete_document_version(document_id, version_id)
    return Response.ok()

@router.patch("/work/{work_id}/document/{document_id}/version/{version_id}", response_model=Response[DocumentDetailResponse])
async def update_document_version_content(
    work_id: str,
    document_id: str,
    version_id: str,
    request: DocumentVersionUploadRequest,
    service: NodeService = Depends(get_node_service)
) -> Response[DocumentDetailResponse]:
    """更新指定版本的内容."""
    data = await service.update_document_version_content(document_id, version_id, request.full_text)
    return Response.ok(data=data)

@router.get("/work/{work_id}/document/{document_id}", response_model=Response[DocumentDetailResponse])
async def get_document_detail(
    work_id: str,
    document_id: str,
    service: NodeService = Depends(get_node_service)
) -> Response[DocumentDetailResponse]:
    """获取文档详情."""
    data = await service.get_node_detail(document_id)
    return Response.ok(data=DocumentDetailResponse(
        id=data.id,
        work_id=data.work_id,
        title=data.name,
        description=data.description,
        from_node_id=data.parent_node_id,
        full_text=data.content,
        now_version=str(data.now_version) if data.now_version else None,
        now_version_id=data.now_version_id # Pass version_id
    ))

# --- Nodes (Folders) ---

@router.post("/work/{work_id}/node", response_model=Response[NodeResponse])
async def create_node(
    work_id: str,
    request: NodeCreateRequest,
    service: NodeService = Depends(get_node_service)
) -> Response[NodeResponse]:
    """创建节点"""
    req = CreateNodeDTO(
        name=request.name,
        description=request.description,
        type=request.type,
        parent_node_id=request.from_node_id
    )
    data = await service.create_node(work_id, req)
    return Response.ok(data=NodeResponse(
        id=data.id,
        name=data.name,
        description=data.description,
        type=data.type,
        from_node_id=data.parent_node_id
    ))

@router.delete("/work/{work_id}/node/{node_id}", response_model=Response[None])
async def delete_node(
    work_id: str,
    node_id: str,
    service: NodeService = Depends(get_node_service)
) -> Response[None]:
    """删除节点."""
    await service.delete_node(node_id)
    return Response.ok()

@router.patch("/work/{work_id}/node/{node_id}", response_model=Response[None])
async def update_node(
    work_id: str,
    node_id: str,
    request: NodeUpdateRequest,
    service: NodeService = Depends(get_node_service)
) -> Response[None]:
    """更新节点."""
    req = UpdateNodeDTO(
        name=request.name,
        description=request.description,
        parent_node_id=request.from_node_id
    )
    await service.update_node(node_id, req)
    return Response.ok()

# --- Relationships ---

# 开发者: BackendAgent(python)
# 当前版本: BE-DEP-20260224-05
# 创建时间: 2026-02-24 00:22
# 更新时间: 2026-02-24 00:22
# 更新记录:
#     [2026-02-24 00:22:BE-DEP-20260224-05: 注释掉未使用的作品关系与节点迁移接口。]
# 注释者: BackendAgent(python)
# 时间: 2026-02-24 00:22
# 使用位置: 后端路由 /work/{work_id}/document 与 /work/{work_id}/node/{node_id}/parent/{parent_node_id}
# 实现概述: 注释掉关系图返回与节点迁移接口，保留基础节点增删改。
# 废弃标记: 已废弃
# @router.get("/work/{work_id}/document", response_model=Response[RelationshipResponse])
# async def get_work_relationships(
#     work_id: str,
#     service: WorkService = Depends(get_work_service)
# ) -> Response[RelationshipResponse]:
#     """获取依赖关系."""
#     data = await service.get_work_detail(work_id)
#     return Response.ok(data=RelationshipResponse(
#         document=data.document,
#         relationship=data.relationship
#     ))
#
# @router.patch("/work/{work_id}/node/{node_id}/parent/{parent_node_id}", response_model=Response[None])
# async def move_node(
#     work_id: str,
#     node_id: str,
#     parent_node_id: str,
#     service: NodeService = Depends(get_node_service)
# ) -> Response[None]:
#     """迁移节点(改变节点之间的关系)."""
#     req = UpdateNodeDTO(parent_node_id=parent_node_id)
#     await service.update_node(node_id, req)
#     return Response.ok()
