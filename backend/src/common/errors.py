from typing import Any


class BaseError(Exception):
    """- code id
    - message 可覆盖枚举默认消息
    - data 用于附带额外上下文（可选）.
    """

    def __init__(self, code: int, message: str | None = None, data: Any | None = None) -> None:
        self.code = code
        self.message = message
        self.data = data
        super().__init__(self.message)

class DBURLNotFoundError(BaseError):

    def __init__(self, db_url: str):
        super().__init__(5001, message=f"数据库链接不存在: {db_url}")
        self.db_url = db_url

class SessionNotFoundError(BaseError):
    """会话不存在异常（示例），."""

    def __init__(self, session_id: str):
        super().__init__(5001, message=f"会话不存在: {session_id}")
        self.session_id = session_id

"""
    小说相关异常: 52xx
"""
class NovelNotFoundError(BaseError):
    """小说不存在异常."""

    def __init__(self, novel_id: str):
        super().__init__(5201, message=f"小说不存在: {novel_id}")
        self.novel_id = novel_id

class DocumentNotFoundError(BaseError):
    """文档不存在异常."""

    def __init__(self, document_id: str):
        super().__init__(5202, message=f"文档不存在: {document_id}")
        self.document_id = document_id
class ResourceNotFoundError(BaseError):
    """资源不存在通用异常."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(40400, message=message)

"""
    插件相关异常: 50xx
"""
class PluginNotFoundError(BaseError):
    """插件不存在异常."""
    def __init__(self, plugin_id: str):
        super().__init__(50010, message=f"插件不存在: {plugin_id}")
        self.plugin_id = plugin_id

