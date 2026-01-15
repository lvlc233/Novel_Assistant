from pydantic import Field
from api.routes.base import BaseRequest

"""
    用户相关
"""
class CreateUserRequest(BaseRequest):
    """用户信息"""
    name: str|None = Field(default=None, description="用户名称")
    password: str|None = Field(default=None, description="用户密码")
