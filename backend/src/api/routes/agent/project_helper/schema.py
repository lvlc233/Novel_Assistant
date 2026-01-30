class ProjectHelperChatConfigResponse(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

class ProjectHelperChatConfigRequest(BaseModel):
    model_name: str # 模型名称
    base_url: str # 基础URL
    api_key: str # API密钥
    user_prompt: str # 用户提示

class ProjectHelperResourcesResponse(BaseModel):
    resource_name: list[str] # 资源名称列表
    enabled: bool # 是否启用

class ProjectHelperResourcesRequest(BaseModel):
    resource_name: list[str] # 资源名称列表
    enabled: bool # 是否启用