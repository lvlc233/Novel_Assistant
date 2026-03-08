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
        """读取当前文档上下文快照。

        调用时机:
        - 当用户询问“当前文档写了什么”“标题是什么”“当前是哪个版本”时必须先调用。
        - 在执行改写、续写、润色前，若你不确定最新上下文，先调用本工具再决策。

        参数说明:
        - version: 仅用于标注读取意图，通常传 "current"。

        返回字段:
        - title: 当前文档标题。
        - char_count: 当前文档字符数。
        - content_preview: 文档前300字符预览。
        - work_id/document_id/version_id: 当前文档定位信息。

        使用规则:
        - 不要凭空假设文档状态，优先使用本工具读取。
        - 读取后再生成结论或再决定是否调用写入工具。
        """
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
        """修改文档标题与正文内容（真实写库）。

        调用时机:
        - 用户明确要求“改标题”“改正文”“替换某段内容”时调用。
        - 需要将草稿结果真正写入数据库时调用，而不是仅给建议文本。

        参数说明:
        - target_range: 本次修改目标描述，建议传自然语言区间，如 "title"、"全文"、"第2段"。
        - patch_type:
          - "title": 仅修改标题。
          - "body": 仅修改正文版本内容。
          - "title_and_body": 同时更新标题与正文。
        - new_content: 要写入的新内容。
        - reason: 修改原因，便于审计与追踪。
        - document_id/version_id: 可选；不传则使用运行时默认上下文。

        使用规则:
        - 先确认用户意图再写入，避免无授权改动。
        - 当 patch_type 包含 body 时，必须保证可解析到 version_id。
        - 返回 status=success 才表示数据库写入完成。
        """
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
        """管理文档目录树结构（新增/更新/删除/移动）。

        调用时机:
        - 用户要求调整章节目录、移动章节、删除节点、重命名目录时必须调用本工具。
        - 当任务属于“结构管理”而非“正文改写”时优先使用本工具。

        参数说明:
        - action:
          - "add": 新增目录节点。
          - "update": 更新节点名称/描述/父节点。
          - "delete": 删除节点。
          - "move": 移动节点到新父节点。
        - node_id:
          - add 时可传目标父节点或参考节点ID。
          - update/delete/move 时传要操作的节点ID。
        - payload: JSON 字符串。
          - add 示例: {"name":"第二章","description":"冲突升级","type":"document","parent_node_id":"<uuid>"}
          - update 示例: {"name":"第二章（修订）","description":"新版描述","parent_node_id":"<uuid>"}
          - move 示例: {"parent_node_id":"<uuid>"}
          - delete 可传 "{}"。
        - reason: 操作原因，便于链路追踪。
        - work_id: add 时可选；不传则使用运行时默认 work_id。

        使用规则:
        - payload 必须是合法 JSON 字符串，字段名保持英文小写下划线风格。
        - 目录变更必须通过本工具执行，不要只在回答中口头说明“已调整”。
        - 返回 status=success 才表示目录写库成功。
        """
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

    @tool("read_work_outline")
    async def read_work_outline(work_id: Optional[str] = None) -> dict:
        """读取整个作品的目录结构（卷、章、大盘信息）。

        调用时机:
        - 当你需要了解作品的整体组织架构、有哪些卷、哪些章节时调用。
        - 当你需要确认某个章节所属的卷，或者寻找特定名称的章节ID时调用。

        返回字段:
        - work_name: 作品名称。
        - tree: 递归的树状结构，包含 id, name, type (folder/document), children。
        """
        from services.work.service import WorkService
        
        resolved_work_id = work_id or default_work_id
        if not resolved_work_id:
            return {"status": "error", "message": "无法确定作品ID，请明确提供或在支持的作品上下文中调用"}
            
        work_service = WorkService(session)
        detail = await work_service.get_work_detail(resolved_work_id)
        
        # 构建内存中的索引映射
        node_map = {str(n.id): {"id": str(n.id), "name": n.name, "type": n.type.value, "children": []} for n in detail.document}
        
        child_ids = set()
        for edge in detail.relationship:
            parent_id = edge.from_node_id
            if parent_id in node_map:
                for tid in edge.to_node_ids:
                    if tid in node_map:
                        node_map[parent_id]["children"].append(node_map[tid])
                        child_ids.add(tid)
        
        # 根节点是那些不在任何 children 里的节点
        root_nodes = [node for node_id, node in node_map.items() if node_id not in child_ids]
        
        return {
            "work_id": resolved_work_id,
            "work_name": detail.meta.name,
            "tree": root_nodes
        }

    return [read_document_info, patch_document_content, manage_outline, read_work_outline]
