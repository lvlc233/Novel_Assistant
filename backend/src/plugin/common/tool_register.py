
from functools import wraps
from typing import Callable,List




# 插件注解,用于对将任意包装成为可以注册的工具,并通过get_tool_in_plugin函数获取对应的工具信息
# 可以对函数注解,也可以对整个类注解,对整个类注解的时候,相当于对这个类的方法注解
# 被注册的工具以键值对的形式保留,key是
class PluginToolInfo:
    name: str #插件名字,用切割不同的区域
    tool: Callable  # 可以调用的工具
    description:str # 
TOOL_IN_PLUGIN={}
def plugin(name:str,description:str) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)  # 保留原函数元信息
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def greet(name: str) -> None:
    print(f"Hi {name}")





# 从插件中获取工具
async def get_tool_in_plugin(plugin_name: list[str])->List[Callable]: 
    
    
    pass