from typing import Any


class BaseError(Exception):
    """

    - code id
    - message 可覆盖枚举默认消息
    - data 用于附带额外上下文（可选）
    """

    def __init__(self, code: str, message: str | None = None, data: Any | None = None) -> None:
        self.code = code
        self.message = message
        self.data = data
        super().__init__(self.message)


class SessionNotFoundError(BaseError):
    """会话不存在异常（示例），"""

    def __init__(self, session_id: str):
        super().__init__("5001", message=f"会话不存在: {session_id}")
        self.session_id = session_id

"""
    用户相关异常: 51xx
"""
class UserExistsError(BaseError):
    """用户已存在异常"""

    def __init__(self, user_name: str):
        super().__init__("5101", message=f"用户已存在: {user_name}")
        self.user_name = user_name
class UserNotFoundError(BaseError):
    """用户不存在异常"""

    def __init__(self, user_name: str):
        super().__init__("5102", message=f"用户不存在: {user_name}")
        self.user_name = user_name
class UserPasswordError(BaseError):
    """用户密码错误异常"""

    def __init__(self, user_name: str, password: str):
        super().__init__("5103", message=f"用户密码错误: {user_name, password}")
        self.user_name = user_name
        self.password = password

"""
    小说相关异常: 52xx
"""
class NovelNotFoundError(BaseError):
    """小说不存在异常"""

    def __init__(self, novel_id: str):
        super().__init__("5201", message=f"小说不存在: {novel_id}")
        self.novel_id = novel_id

class DocumentNotFoundError(BaseError):
    """文档不存在异常"""

    def __init__(self, document_id: str):
        super().__init__("5202", message=f"文档不存在: {document_id}")
        self.document_id = document_id
class DocumentVersionNotFoundError(BaseError):
    """文档版本不存在异常"""

    def __init__(self, document_id: str):
        super().__init__("5203", message=f"文档版本不存在: {document_id}")
        self.document_id = document_id
