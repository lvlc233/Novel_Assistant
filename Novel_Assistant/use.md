src/main.py:主启动

### 加载模型
基于yaml配置文件
```yaml
atom_build: # key
  model_name: "Pro/deepseek-ai/DeepSeek-V3" #模型名
  base_url: "https://api.siliconflow.cn/v1" #供应商
  api_key: "sk-ealzunszydvqahiynthhvesagiwkdefhgvsxbsxmbfcyurkm" #key
  # 其他配置
  config: 
    temperature: 0
    top_p: 0
    max_tokens: 2048
```
```python
from common.utils import load_chat_model

model=load_chat_model("atom_build") #传入yaml中的key名, 若key不存在或不传入, 则默认使用key为default的配置
```
其中`load_chat_model`基于`config/agent/model_config.py`中的配置加载模型,该文件仅表述数据模型,其中的config/loader.py表示通用的yaml加载器,每个其他配置文件的加载器应该继承该加载器,并重写load_config方法,以加载该配置文件的具体配置逻辑,而可以使用该加载器的其他工具函数


# Agent相关
## AGUI使用
在src/api/app.py中的create_app函数中, 配置了agent的路由, 如下:
```python
    # agent 路由配置:agui
    sdk = CopilotKitRemoteEndpoint(
        agents=[
            LangGraphAGUIAdapter (
                name="sample_agent",
                description="一个模拟智能体",
                graph=chat_helper,
            )
        ]
    )
    app.include_router(sdk.router, prefix="/agent")
```

