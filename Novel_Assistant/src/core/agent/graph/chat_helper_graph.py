import logging
from typing import List, Optional, Any, AsyncIterator
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.language_models import BaseChatModel

from common.utils import load_chat_model


class ChatHelperAgent:
    """聊天助手 Agent：使用 LangChain 的聊天模型"""

    def __init__(self, tools: Optional[List[Any]] = None):
        """初始化聊天助手

        Args:
            tools: 工具列表，默认为空列表
        """
        self.tools = tools or []
        self.chat_model = self._load_model()
        self.system_prompt = """你是一个小说创作助手，帮助用户进行小说创作、角色设定、情节发展等工作。

你可以:
1. 帮助构思小说情节和故事线
2. 协助角色设定和发展
3. 提供写作建议和技巧
4. 讨论故事结构和叙事技巧
5. 帮助解决创作瓶颈

请保持友好、专业且富有创意的对话风格。"""
        logging.info("聊天助手 Agent 已初始化")

    def _load_model(self) -> BaseChatModel:
        """加载聊天模型"""
        try:
            model = load_chat_model("chat")
            logging.info("聊天模型加载成功")
            return model
        except Exception as e:
            logging.error(f"加载聊天模型失败: {e}")
            raise

    def _create_prompt(self, query: str, history: Optional[List[BaseMessage]] = None) -> List[BaseMessage]:
        """创建提示词"""
        messages = []

        # 添加系统提示词
        messages.append({"role": "system", "content": self.system_prompt})

        # 添加历史消息
        if history:
            for msg in history:
                if isinstance(msg, HumanMessage):
                    messages.append({"role": "user", "content": msg.content})
                elif isinstance(msg, AIMessage):
                    messages.append({"role": "assistant", "content": msg.content})

        # 添加当前用户消息
        messages.append({"role": "user", "content": query})

        return messages

    async def astream(
        self,
        query: str,
        history: Optional[List[BaseMessage]] = None,
        config: Optional[RunnableConfig] = None
    ) -> AsyncIterator[str]:
        """异步流式处理用户查询

        Args:
            query: 用户查询
            history: 历史消息列表
            config: 运行配置

        Yields:
            str: 流式响应的文本块
        """
        try:
            # 创建消息
            messages = self._create_prompt(query, history)

            # 流式调用模型
            async for chunk in self.chat_model.astream(messages):
                if chunk.content:
                    yield chunk.content

        except Exception as e:
            logging.error(f"Agent 执行出错: {e}")
            yield f"抱歉，处理您的请求时出错: {str(e)}"

    async def ainvoke(
        self,
        query: str,
        history: Optional[List[BaseMessage]] = None,
        config: Optional[RunnableConfig] = None
    ) -> str:
        """异步非流式调用

        Args:
            query: 用户查询
            history: 历史消息列表
            config: 运行配置

        Returns:
            str: 完整响应
        """
        try:
            # 创建消息
            messages = self._create_prompt(query, history)

            # 调用模型
            response = await self.chat_model.ainvoke(messages)
            return response.content or ""

        except Exception as e:
            logging.error(f"Agent 执行出错: {e}")
            return f"抱歉，处理您的请求时出错: {str(e)}"


# 全局实例
chat_helper_agent = ChatHelperAgent()