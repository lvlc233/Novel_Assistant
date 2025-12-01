"""WebSocket router for real-time chat communication."""
import json
import logging
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Query
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel

from core.agent.graph.chat_helper_graph import chat_helper_agent
from api.models import  Response

router = APIRouter(tags=["websocket"])


class WebSocketMessage(BaseModel):
    """WebSocket消息模型"""
    type: str
    content: str
    timestamp: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[dict] = None


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # session_id -> WebSocket 映射
        self.active_connections: Dict[str, WebSocket] = {}
        # session_id -> 历史消息 映射
        self.session_histories: Dict[str, List[BaseMessage]] = {}
        # session_id -> 连接信息 映射
        self.connection_info: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, session_id: str, client_info: Optional[dict] = None):
        """建立连接"""
        await websocket.accept()
        self.active_connections[session_id] = websocket

        # 初始化该 session 的历史记录
        if session_id not in self.session_histories:
            self.session_histories[session_id] = []

        # 保存连接信息
        self.connection_info[session_id] = {
            "connected_at": datetime.now().isoformat(),
            "client_info": client_info or {},
            "message_count": 0
        }

        logging.info(f"Session {session_id} 已连接")

        # 发送连接成功消息
        await self.send_personal_message(json.dumps({
            "type": "connection",
            "content": "连接成功",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }), session_id)

    def disconnect(self, session_id: str):
        """断开连接"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            if session_id in self.connection_info:
                del self.connection_info[session_id]
            logging.info(f"Session {session_id} 已断开连接")

    def get_history(self, session_id: str) -> List[BaseMessage]:
        """获取历史消息"""
        return self.session_histories.get(session_id, [])

    def add_to_history(self, session_id: str, message: BaseMessage):
        """添加消息到历史"""
        if session_id not in self.session_histories:
            self.session_histories[session_id] = []
        self.session_histories[session_id].append(message)

        # 更新消息计数
        if session_id in self.connection_info:
            self.connection_info[session_id]["message_count"] += 1

        # 限制历史消息数量，避免 token 过多
        if len(self.session_histories[session_id]) > 20:
            self.session_histories[session_id] = self.session_histories[session_id][-20:]

    async def send_personal_message(self, message: str, session_id: str):
        """发送个人消息"""
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(message)

    async def send_json_message(self, data: dict, session_id: str):
        """发送JSON消息"""
        await self.send_personal_message(json.dumps(data), session_id)

    async def broadcast(self, message: str):
        """广播消息"""
        for connection in self.active_connections.values():
            await connection.send_text(message)

    def get_session_stats(self) -> dict:
        """获取会话统计信息"""
        return {
            "active_sessions": len(self.active_connections),
            "total_sessions": len(self.session_histories),
            "sessions": {
                session_id: {
                    "connected": session_id in self.active_connections,
                    "message_count": info["message_count"],
                    "connected_at": info["connected_at"]
                }
                for session_id, info in self.connection_info.items()
            }
        }


# 全局连接管理器
manager = ConnectionManager()


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat_endpoint(websocket: WebSocket, session_id: str):
    """聊天 WebSocket 端点

    消息格式:
    - 客户端发送: {"type": "message", "content": "用户消息"}
    - 客户端发送: {"type": "ping", "content": ""}
    - 服务端回复: {"type": "connection", "content": "连接成功"}
    - 服务端回复: {"type": "pong", "content": ""}
    - 服务端回复: {"type": "stream", "content": "流式内容"}
    - 服务端回复: {"type": "error", "content": "错误信息"}
    - 服务端回复: {"type": "complete", "content": "", "full_response": "完整回复"}
    """
    client_info = {
        "user_agent": websocket.headers.get("user-agent", "Unknown"),
        "client_ip": websocket.client.host if websocket.client else "Unknown"
    }

    await manager.connect(websocket, session_id, client_info)

    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                await manager.send_json_message({
                    "type": "error",
                    "content": "消息格式错误，必须是有效的JSON",
                    "timestamp": datetime.now().isoformat()
                }, session_id)
                continue

            message_type = message_data.get("type", "")
            timestamp = datetime.now().isoformat()

            # 处理不同类型的消息
            if message_type == "ping":
                # 心跳消息
                await manager.send_json_message({
                    "type": "pong",
                    "content": "",
                    "timestamp": timestamp
                }, session_id)

            elif message_type == "message":
                await _handle_chat_message(message_data, session_id, timestamp)

            elif message_type == "clear_history":
                # 清空历史消息
                if session_id in manager.session_histories:
                    manager.session_histories[session_id] = []
                await manager.send_json_message({
                    "type": "history_cleared",
                    "content": "历史消息已清空",
                    "timestamp": timestamp
                }, session_id)

            else:
                await manager.send_json_message({
                    "type": "error",
                    "content": f"未知的消息类型: {message_type}",
                    "timestamp": timestamp
                }, session_id)

    except WebSocketDisconnect:
        manager.disconnect(session_id)
        logging.info(f"Session {session_id} 断开连接")

    except Exception as e:
        logging.error(f"WebSocket 错误: {e}")
        await manager.send_json_message({
            "type": "error",
            "content": f"服务器错误: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }, session_id)
        manager.disconnect(session_id)


async def _handle_chat_message(message_data: dict, session_id: str, timestamp: str):
    """处理聊天消息"""
    user_content = message_data.get("content", "").strip()
    if not user_content:
        await manager.send_json_message({
            "type": "error",
            "content": "消息内容不能为空",
            "timestamp": timestamp
        }, session_id)
        return

    # 将用户消息添加到历史
    user_message = HumanMessage(content=user_content)
    manager.add_to_history(session_id, user_message)

    # 获取历史消息
    history = manager.get_history(session_id)

    # 创建运行配置
    config = RunnableConfig(
        configurable={"session_id": session_id},
    )

    # 发送开始处理消息
    await manager.send_json_message({
        "type": "processing_start",
        "content": "正在处理您的消息...",
        "timestamp": timestamp
    }, session_id)

    # 流式调用 Agent
    full_response = ""
    try:
        chunk_count = 0
        async for chunk in chat_helper_agent.astream(
            query=user_content,
            history=history[:-1],  # 排除当前消息
            config=config
        ):
            if chunk:
                full_response += chunk
                chunk_count += 1
                # 发送流式响应
                await manager.send_json_message({
                    "type": "stream",
                    "content": chunk,
                    "chunk_index": chunk_count,
                    "timestamp": datetime.now().isoformat()
                }, session_id)

        # 发送完成消息
        await manager.send_json_message({
            "type": "complete",
            "content": "",
            "full_response": full_response,
            "chunk_count": chunk_count,
            "timestamp": datetime.now().isoformat()
        }, session_id)

        # 将 AI 回复添加到历史
        ai_message = AIMessage(content=full_response)
        manager.add_to_history(session_id, ai_message)

        logging.info(f"Session {session_id}: 处理了 {chunk_count} 个响应块，总长度 {len(full_response)} 字符")

    except Exception as e:
        logging.error(f"处理消息时出错: {e}")
        error_msg = f"处理消息时出错: {str(e)}"
        await manager.send_json_message({
            "type": "error",
            "content": error_msg,
            "timestamp": datetime.now().isoformat()
        }, session_id)


@router.get("/ws/history/{session_id}")
async def get_chat_history(session_id: str):
    """获取指定 session 的历史消息"""
    history = manager.get_history(session_id)

    # 转换历史消息为可序列化的格式
    history_data = []
    for msg in history:
        if isinstance(msg, HumanMessage):
            history_data.append({
                "role": "user",
                "content": msg.content
            })
        elif isinstance(msg, AIMessage):
            history_data.append({
                "role": "assistant",
                "content": msg.content
            })

    return Response.ok({
        "session_id": session_id,
        "history": history_data,
        "count": len(history_data)
    })


@router.get("/ws/history/{session_id}")
async def get_chat_history(session_id: str):
    """获取指定 session 的历史消息"""
    history = manager.get_history(session_id)

    # 转换历史消息为可序列化的格式
    history_data = []
    for msg in history:
        if isinstance(msg, HumanMessage):
            history_data.append({
                "role": "user",
                "content": msg.content,
                "timestamp": getattr(msg, 'timestamp', None) or datetime.now().isoformat()
            })
        elif isinstance(msg, AIMessage):
            history_data.append({
                "role": "assistant",
                "content": msg.content,
                "timestamp": getattr(msg, 'timestamp', None) or datetime.now().isoformat()
            })

    return Response.ok({
        "session_id": session_id,
        "history": history_data,
        "count": len(history_data)
    })


@router.delete("/ws/history/{session_id}")
async def clear_chat_history(session_id: str):
    """清空指定 session 的历史消息"""
    if session_id in manager.session_histories:
        manager.session_histories[session_id] = []
        return Response.ok({"message": f"Session {session_id} 历史已清空"})
    else:
        return Response.fail(f"Session {session_id} 不存在")


@router.get("/ws/stats")
async def get_websocket_stats():
    """获取WebSocket连接统计信息"""
    return Response.ok(manager.get_session_stats())


@router.post("/ws/session")
async def create_new_session():
    """创建新的会话"""
    new_session_id = str(uuid.uuid4())
    return Response.ok({
        "session_id": new_session_id,
        "message": f"新会话已创建: {new_session_id}"
    })


@router.get("/ws/health")
async def websocket_health():
    """WebSocket服务健康检查"""
    stats = manager.get_session_stats()
    return Response.ok({
        "status": "healthy",
        "service": "websocket",
        "active_connections": stats["active_sessions"],
        "total_sessions": stats["total_sessions"],
        "timestamp": datetime.now().isoformat()
    })

