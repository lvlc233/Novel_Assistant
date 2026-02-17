# 定义Agent相关的资源: 其实就是提示词

PAGE_INFO={}

HOME_PAGE="""


"""

PLUGIN_PAGE="""
插件助手
"""

WORK_PAGE="""
作品助手帮助页面
"""

DOCUMENT_PAGE="""
文档助手帮助页面
"""

DOCUMENT_DETAIL_PAGE="""
文档助手详细帮助页面
"""

async def get_page_info(page_id:str) -> str:
    """
    获取页面信息
    """
