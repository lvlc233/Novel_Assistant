from pydantic import Field
from api.base import BaseRequest

"""
    知识库相关
"""
class GetKDsRequest(BaseRequest):
    """获取知识库的请求"""
    user_id: int = Field(...,description="用户ID")
