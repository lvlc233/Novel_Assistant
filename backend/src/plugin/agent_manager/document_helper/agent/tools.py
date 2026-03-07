import json
from typing import Literal, Optional
from uuid import UUID

from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession

from api.routes.node.schema import CreateNodeDTO, UpdateNodeDTO
from common.enums import NodeTypeEnum
from services.node.service import NodeService


def build_document_helper_tools(
    document_content: str,
    session: AsyncSession,
    document_title: Optional[str] = None,
    default_work_id: Optional[str] = None,
    default_document_id: Optional[str] = None,
    default_version_id: Optional[str] = None,
):
    normalized_content = document_content or ""
    first_line = normalized_content.strip().splitlines()[0] if normalized_content.strip() else "未命名文档"
    resolved_title = document_title or first_line
    node_service = NodeService(session)

    @tool("read_document_info")
    async def read_document_info(version: str = "current") -> dict:
        """使用这个工具以获取当前文档的信息"""
        resolved_document_id = default_document_id
        resolved_version_id = default_version_id
        if resolved_document_id and not resolved_version_id:
            detail = await node_service.get_node_detail(resolved_document_id)
            resolved_version_id = str(detail.now_version_id) if detail.now_version_id else None
        return {
            "version": version,
            "title": resolved_title,
            "char_count": len(normalized_content),
            "content_preview": normalized_content[:300],
            "work_id": default_work_id,
            "document_id": resolved_document_id,
            "version_id": resolved_version_id,
        }

    @tool("patch_document_content")
    async def patch_document_content(
        target_range: str,
        patch_type: Literal["title", "body", "title_and_body"],
        new_content: str,
        reason: str,
        document_id: Optional[str] = None,
        version_id: Optional[str] = None,
    ) -> dict:
        """使用这个工具可以修改文档的内容,patch_type=title:修改标题,patch_type= body:修改正文,"""
        resolved_document_id = document_id or default_document_id
        if not resolved_document_id:
            return {"status": "error", "message": "缺少 document_id，无法执行文档修改"}
        resolved_version_id = version_id or default_version_id
        if not resolved_version_id:
            detail = await node_service.get_node_detail(resolved_document_id)
            resolved_version_id = str(detail.now_version_id) if detail.now_version_id else None
        if patch_type in {"title", "title_and_body"}:
            await node_service.update_node(
                resolved_document_id,
                UpdateNodeDTO(name=new_content),
            )
        if patch_type in {"body", "title_and_body"}:
            if not resolved_version_id:
                return {"status": "error", "message": "缺少 version_id，无法执行正文修改"}
            await node_service.update_document_version_content(
                resolved_document_id,
                resolved_version_id,
                new_content,
            )
        return {
            "status": "success",
            "operation": "patch_document_content",
            "target_range": target_range,
            "patch_type": patch_type,
            "reason": reason,
            "document_id": resolved_document_id,
            "version_id": resolved_version_id,
        }

    @tool("manage_outline")
    async def manage_outline(
        action: Literal["add", "update", "delete", "move"],
        node_id: str,
        payload: str,
        reason: str,
        work_id: Optional[str] = None,
    ) -> dict:
        """使用这个工具可以管理文档的目录结构,action=add:添加目录项,action=update:更新目录项,action=delete:删除目录项,action=move:移动目录项"""
        resolved_work_id = work_id or default_work_id
        payload_data = {}
        if payload:
            try:
                payload_data = json.loads(payload)
            except Exception:
                payload_data = {"name": payload}
        if action == "delete":
            await node_service.delete_node(node_id)
            return {"status": "success", "operation": "manage_outline", "action": action, "node_id": node_id, "reason": reason}
        if action == "move":
            parent_id_value = payload_data.get("parent_node_id")
            parent_uuid = UUID(parent_id_value) if parent_id_value else None
            await node_service.update_node(node_id, UpdateNodeDTO(parent_node_id=parent_uuid))
            return {"status": "success", "operation": "manage_outline", "action": action, "node_id": node_id, "parent_node_id": parent_id_value, "reason": reason}
        if action == "update":
            parent_id_value = payload_data.get("parent_node_id")
            parent_uuid = UUID(parent_id_value) if parent_id_value else None
            await node_service.update_node(
                node_id,
                UpdateNodeDTO(
                    name=payload_data.get("name"),
                    description=payload_data.get("description"),
                    parent_node_id=parent_uuid,
                ),
            )
            return {"status": "success", "operation": "manage_outline", "action": action, "node_id": node_id, "reason": reason}
        if action == "add":
            if not resolved_work_id:
                return {"status": "error", "message": "缺少 work_id，无法新增目录项"}
            parent_id_value = payload_data.get("parent_node_id") or node_id
            parent_uuid = UUID(parent_id_value) if parent_id_value else None
            node_type_raw = str(payload_data.get("type", "folder")).lower()
            node_type = NodeTypeEnum.DOCUMENT if node_type_raw == "document" else NodeTypeEnum.FOLDER
            created = await node_service.create_node(
                resolved_work_id,
                CreateNodeDTO(
                    name=payload_data.get("name") or "新目录项",
                    description=payload_data.get("description"),
                    type=node_type,
                    parent_node_id=parent_uuid,
                ),
            )
            return {
                "status": "success",
                "operation": "manage_outline",
                "action": action,
                "node_id": str(created.id),
                "parent_node_id": parent_id_value,
                "reason": reason,
            }
        return {
            "status": "error",
            "operation": "manage_outline",
            "action": action,
            "node_id": node_id,
            "message": f"不支持的 action: {action}",
        }

    return [read_document_info, patch_document_content, manage_outline]
