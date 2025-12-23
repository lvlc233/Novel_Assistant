"""API模型"""
from tkinter import N
from typing import List, TypeVar, Generic,Union

from pydantic import BaseModel, Field

"""请求相关"""
class BaseRequest(BaseModel):
    """统一的 API 请求基类。"""
    pass
"""
    用户相关
"""
class CreateUserRequest(BaseRequest):
    """用户信息"""
    name: str|None = Field(default=None, description="用户名称")
    password: str|None = Field(default=None, description="用户密码")


"""
    小说相关
"""
class CreateNovelRequest(BaseRequest):
    """小说信息"""
    user_id: str = Field(..., description="用户ID")
    novel_cover_image_url: str|None = Field(default=None,description="小说封面url")
    novel_name: str|None = Field(default=None, description="小说名称")
    novel_summary: str|None = Field(default=None, description="小说简介")
    kd_id_list: List[str] = Field(default=[], description="知识库ID列表")
    


class GetNovelListRequest(BaseRequest):
    """获取小说列表请求"""
    user_id: str = Field(..., description="用户ID")

class GetNovelDetailRequest(BaseRequest):
    """获取小说详情请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")

class DeleteNovelRequest(BaseRequest):
    """删除小说请求"""
    novel_id: str = Field(..., description="小说ID")

class UpdateNovelRequest(BaseRequest):
    """修改小说信息请求"""
    novel_id: str = Field(..., description="小说ID")
    name: str | None = Field(default=None, description="小说名称")
    summary: str | None = Field(default=None, description="小说简介")

class CreateDocumentRequest(BaseRequest):
    """创建文档请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    folder_id: str|None = Field(default=None, description="文件夹ID")

class DeleteDocumentRequest(BaseRequest):
    """删除文档请求"""
    document_id: str = Field(..., description="文档ID")


class SendQueryToChatHelperRequest(BaseRequest):
    """发送查询到聊天助手请求模型"""
    query: str = Field(..., description="用户发送的信息")

class SearchDocumentRequest(BaseRequest):
    """搜索文档请求"""
    query: str = Field(..., description="查询文本")
    novel_id: str | None = Field(default=None, description="小说ID，可选")
    search_by_title: bool = Field(default=True, description="是否根据标题搜索")
    search_by_content: bool = Field(default=False, description="是否根据正文搜索")
    is_remove: bool = Field(default=False, description="是否搜索已删除文档")

class CreateFolderRequest(BaseRequest):
    """创建文件夹请求"""
    user_id: str = Field(..., description="用户ID")
    novel_id: str = Field(..., description="小说ID")
    name: str = Field(..., description="文件夹名称")
    
class DeleteFolderRequest(BaseRequest):
    """删除文件夹请求"""
    folder_id: str = Field(..., description="文件夹ID")

class UpdateFolderRequest(BaseRequest):
    """更新文件夹请求"""
    folder_id: str = Field(..., description="文件夹ID")
    name: str = Field(..., description="文件夹名称")

class UpdateDocumentRequest(BaseRequest):
    """更新文档请求"""
    document_id: str = Field(..., description="文档ID")
    title: str | None = Field(default=None, description="文档标题")
    body_text: str | None = Field(default=None, description="文档内容")
    
class GetDocumentDetailRequest(BaseRequest):
    """获取文档详情请求"""
    document_id: str = Field(..., description="文档ID")

class MoveNodeRequest(BaseRequest):
    """移动节点请求"""
    node_id: str = Field(..., description="节点ID")
    target_parent_id: str | None = Field(default=None, description="目标父节点ID（文件夹ID），为None表示根目录")
    sort_order: int = Field(default=0, description="排序位置")

"""
    知识库相关
"""
class GetKDsRequest(BaseRequest):
    """获取知识库的请求"""
    user_id: int = Field(...,description="用户ID")

















# 响应体
class FolderResponse(BaseModel):
    """文件夹响应"""
    folder_id: str = Field(..., description="文件夹ID")
    name: str = Field(..., description="文件夹名称")

class DocumentDetailResponse(BaseModel):
    """文档详情响应"""
    document_id: str = Field(..., description="文档ID")
    title: str = Field(..., description="文档标题")
    body_text: str | None = Field(default=None, description="文档内容")
    current_version_id: str = Field(..., description="当前版本ID")
    update_time: str = Field(..., description="更新时间")

T = TypeVar("T")
class Response(BaseModel, Generic[T]):
    """统一响应模型（支持泛型），可用作 Response[InitSessionData] 等"""

    code: str = Field(..., description="状态码")
    data: T | None = Field(default=None, description="响应数据")
    message: str | None = Field(default=None, description="响应消息")
 

    @classmethod
    def ok(cls, data: T | None = None) -> "Response[T]":
        return cls(code="200", data=data)

    @classmethod
    def fail(cls,code:str, message: str , data: T | None = None) -> "Response[T]":    
        # 支持自定义失败消息，否则使用枚举默认消息
        return cls(code=code, data=data, message=message )

class UserIdResponse(BaseModel):
    """用户ID"""
    user_id: str = Field(..., description="用户ID")

class NovelAbbreviateResponse(BaseModel):
    """小说缩略视图"""
    novel_id: str = Field(..., description="小说ID")
    novel_name: str = Field(..., description="小说名称")
    image_url: str|None = Field(default=None, description="小说封面URL")
    summary: str|None = Field(default=None, description="小说简介")
    state: str = Field(..., description="小说状态")
    create_time: str = Field(..., description="创建时间")
    update_time: str = Field(..., description="更新时间")
    hiatus_interval: int = Field(..., description="上次更新时间间隔（天）")


class DocumentItemInAPI(BaseModel):
    """目录项"""
    document_name: str = Field(..., description="文档名")
    current_version: str = Field(..., description="当前版本")
    document_version_list: List[str] = Field(..., description="文档版本列表")
class FolderItemInAPI(BaseModel):
    """目录项"""
    folder_name: str = Field(..., description="文件夹名")
    document_list: List[DocumentItemInAPI] = Field(..., description="文档列表")
    
class NovelDetailResponse(BaseModel):
    """小说详情响应"""
    novel_id: str = Field(..., description="小说ID")
    novel_name: str = Field(..., description="小说名称")
    image_url: str|None = Field(default=None, description="小说封面URL")
    summary: str|None = Field(default=None, description="小说简介")
    state: str = Field(..., description="小说状态")
    create_time: str = Field(..., description="创建时间")
    update_time: str = Field(..., description="更新时间")
    hiatus_interval: int = Field(..., description="上次更新时间间隔（天）")
    menu: List[Union[FolderItemInAPI, DocumentItemInAPI]] = Field(default=[], description="小说目录")

class CreateDocumentResponse(BaseModel):
    """文档项"""
    document_id: str = Field(..., description="文档ID")
    title: str = Field(..., description="标题名")
    current_version: str = Field(..., description="当前版本")
    document_version_list: List[str] = Field(..., description="文档版本列表")
    body_text: str|None = Field(default=None, description="文档内容") 
    create_time: str = Field(..., description="创建时间")
    update_time: str = Field(..., description="更新时间")

class SearchDocumentResponse(BaseModel):
    """搜索文档响应"""
    doc_id: str = Field(..., description="文档ID")
    title: str = Field(..., description="文档标题")
    body_text: str|None = Field(default=None, description="文档正文")



import json
from copilotkit import Agent
from copilotkit.types import Message,MetaEvent 
from copilotkit.action import ActionDict
from copilotkit.langgraph import langchain_messages_to_copilotkit
from copilotkit.langgraph_agent import (
    CopilotKitConfig,
    langgraph_default_merge_state,
    copilotkit_messages_to_langchain,
    filter_by_schema_keys,
    _StreamingStateExtractor)
from copilotkit.logging import get_logger
from typing import Optional,Callable,Any,cast,Literal
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import Command
from langchain_core.runnables.config import RunnableConfig,ensure_config
from langchain_core.messages import HumanMessage,SystemMessage
from langchain_core.load import dumps
logger = get_logger(__name__)

class LangGraphAGUIAdapter(Agent):
    """"""
    def __init__(
            self,
            *,
            name: str,
            graph: Optional[CompiledStateGraph] = None,
            description: Optional[str] = None,
            langgraph_config:  Union[Optional[RunnableConfig], dict] = None,
            copilotkit_config: Optional[CopilotKitConfig] = None,

            # deprecated - use langgraph_config instead
            config: Union[Optional[RunnableConfig], dict] = None,
            # deprecated - use graph instead
            agent: Optional[CompiledStateGraph] = None,
            # deprecated - use copilotkit_config instead
            merge_state: Optional[Callable] = None,
        ):
        if config is not None:
            logger.warning("Warning: config is deprecated, use langgraph_config instead")

        if agent is not None:
            logger.warning("Warning: agent is deprecated, use graph instead")

        if merge_state is not None:
            logger.warning("Warning: merge_state is deprecated, use copilotkit_config instead")

        if graph is None and agent is None:
            raise ValueError("graph must be provided")

        super().__init__(
            name=name,
            description=description,
        )

        self.merge_state = None
        self.thread_state = {}
        if copilotkit_config is not None:
            self.merge_state = copilotkit_config.get("merge_state")
        if not self.merge_state and merge_state is not None:
            self.merge_state = merge_state
        if not self.merge_state:
            self.merge_state = langgraph_default_merge_state

        self.convert_messages = (
            copilotkit_config.get("convert_messages")
            if copilotkit_config
            else None
        ) or copilotkit_messages_to_langchain(use_function_call=False)

        self.langgraph_config = langgraph_config or config

        self.graph = cast(CompiledStateGraph, graph or agent)
        self.active_interrupt_event = False

    def execute( # pylint: disable=too-many-arguments
            self,
            *,
            state: dict,
            config: Optional[dict] = None,
            messages: List[Message],
            thread_id: str,
            actions: Optional[List[ActionDict]] = None,
            meta_events: Optional[List[MetaEvent]] = None,
            **kwargs
    ):
        node_name = kwargs.get("node_name")

        return self._stream_events(
            state=state,
            config=config,
            messages=messages,
            actions=actions,
            thread_id=thread_id,
            node_name=node_name,
            meta_events=meta_events
        )

    async def prepare_stream( # pylint: disable=too-many-arguments
            self,
            *,
            state_input: Any,
            agent_state: Any,
            config: Optional[dict] = None,
            messages: List[Message],
            thread_id: str,
            actions: Optional[List[ActionDict]] = None,
            node_name: Optional[str] = None,
            meta_events: Optional[List[MetaEvent]] = None,
    ):
        active_interrupts = agent_state.tasks[0].interrupts if agent_state.tasks and agent_state.tasks[0].interrupts else None
        state_input["messages"] = agent_state.values.get("messages", [])
        current_graph_state = agent_state.values
        langchain_messages = self.convert_messages(messages)
        state = cast(Callable, self.merge_state)(
            state=state_input,
            messages=langchain_messages,
            actions=actions,
            agent_name=self.name
        )
        current_graph_state.update(state)
        lg_interrupt_meta_event = next((ev for ev in (meta_events or []) if ev.get("name") == "LangGraphInterruptEvent"), None)
        has_active_interrupts = active_interrupts is not None and len(active_interrupts) > 0

        resume_input = None

        # An active interrupt event that runs through messages. Use latest message as response
        if has_active_interrupts and lg_interrupt_meta_event is None:
            # state["messages"] only includes the messages we need to add at this point, tool call+result if applicable, and user text
            resume_input = Command(resume=state["messages"])

        if lg_interrupt_meta_event and "response" in lg_interrupt_meta_event:
            resume_input = Command(resume=lg_interrupt_meta_event["response"])

        mode = "continue" if thread_id and node_name != "__end__" and node_name is not None else "start"
        thread_id = thread_id or str(uuid.uuid4())
        config["configurable"]["thread_id"] = thread_id

        if mode == "continue" and not has_active_interrupts:
            await self.graph.aupdate_state(config, state, as_node=node_name)


        initial_state = state if mode == "start" else None

        # Use provided resume_input or fallback to initial_state
        stream_input = resume_input if resume_input else initial_state

        # Get the output and input schema keys the user has allowed for this graph
        input_keys, output_keys, config_keys = self.get_schema_keys(config)
        self.output_schema_keys = output_keys
        self.input_schema_keys = input_keys

        stream_input = self.filter_state_on_schema_keys(stream_input, 'input')
        config["configurable"] = filter_by_schema_keys(config["configurable"], config_keys)

        if has_active_interrupts and (not resume_input):
            value = active_interrupts[0].value
            return {
                "stream": None,
                "state": None,
                "config": None,
                "interrupt_event": self.get_interrupt_event(value),
            }

        return {
            "stream": self.graph.astream_events(stream_input, config, version="v2"),
            "state": current_graph_state,
            "config": config
        }

    async def prepare_regenerate_stream( # pylint: disable=too-many-arguments
            self,
            *,
            state: Any,
            config: Optional[dict] = None,
            actions: Optional[List[ActionDict]] = None,
            message_checkpoint: HumanMessage
    ):
        thread_id = config.get("configurable", {}).get("thread_id")
        time_travel_checkpoint = await self.get_checkpoint_before_message(message_checkpoint.id, thread_id)
        if time_travel_checkpoint is None:
            return None

        fork = await self.graph.aupdate_state(
            time_travel_checkpoint.config,
            time_travel_checkpoint.values,
            as_node=time_travel_checkpoint.next[0] if time_travel_checkpoint.next else "__start__"
        )

        stream_input = cast(Callable, self.merge_state)(
            state=time_travel_checkpoint.values,
            messages=[message_checkpoint],
            actions=actions,
            agent_name=self.name
        )
        stream = self.graph.astream_events(stream_input, fork, version="v2")
        return {
            "stream": stream,
            "state": state,
            "config": config
        }


    async def _stream_events( # pylint: disable=too-many-locals
            self,
            *,
            state: Any,
            config: Optional[dict] = None,
            messages: List[Message],
            thread_id: str,
            actions: Optional[List[ActionDict]] = None,
            node_name: Optional[str] = None,
            meta_events: Optional[List[MetaEvent]] = None,
        ):
        default_config = ensure_config(cast(Any, self.langgraph_config.copy()) if self.langgraph_config else {}) # pylint: disable=line-too-long
        config = {**default_config, **(self.graph.config or {}), **(config or {})}
        config["configurable"] = {**config.get("configurable", {}), **(config["configurable"] or {})}
        config["configurable"]["thread_id"] = thread_id

        streaming_state_extractor = _StreamingStateExtractor([])
        prev_node_name = None
        emit_intermediate_state_until_end = None
        should_exit = False
        manually_emitted_state = None
        thread_id = cast(Any, config)["configurable"]["thread_id"]

        agent_state = await self.graph.aget_state(config)
        prepared_stream_response = await self.prepare_stream(
            state_input=state,
            agent_state=agent_state,
            config=config,
            messages=messages,
            actions=actions,
            thread_id=thread_id,
            node_name=node_name,
            meta_events=meta_events
        )

        langchain_messages = self.convert_messages(messages)
        non_system_messages = [msg for msg in langchain_messages if not isinstance(msg, SystemMessage)]
        if len(agent_state.values.get("messages", [])) > len(non_system_messages):
            # Find the last user message by working backwards from the last message
            last_user_message = None
            for i in range(len(langchain_messages) - 1, -1, -1):
                if isinstance(langchain_messages[i], HumanMessage):
                    last_user_message = langchain_messages[i]
                    break

            if last_user_message:
                prepared_stream_response = await self.prepare_regenerate_stream(
                    state=state,
                    config=config,
                    message_checkpoint=last_user_message,
                    actions=actions,
                )

        state = prepared_stream_response["state"]
        current_graph_state = prepared_stream_response["state"]
        stream = prepared_stream_response["stream"]
        config = prepared_stream_response["config"]
        interrupt_event = prepared_stream_response.get('interrupt_event', None)

        if interrupt_event:
            yield interrupt_event
            return

        try:
            async for event in stream:
                current_node_name = event.get("name")
                event_type = event.get("event")
                run_id = event.get("run_id")
                metadata = event.get("metadata", {})

                interrupt_event = (
                    event["data"].get("chunk", {}).get("__interrupt__", None)
                    if (
                        isinstance(event.get("data"), dict) and
                        isinstance(event["data"].get("chunk"), dict)
                    )
                    else None
                )
                if interrupt_event:
                    value = interrupt_event[0].value
                    yield self.get_interrupt_event(value)
                    continue

                should_exit = should_exit or (
                    event_type == "on_custom_event" and
                    event["name"] == "copilotkit_exit"
                )

                # OPTIMIZATION: Update local state from chain_end events to avoid checkpointer calls
                if event_type == "on_chain_end" and isinstance(
                    event.get("data", {}).get("output"), dict
                ):
                    current_graph_state.update(event["data"]["output"])

                emit_intermediate_state = metadata.get("copilotkit:emit-intermediate-state")
                manually_emit_intermediate_state = (
                    event_type == "on_custom_event" and
                    event["name"] == "copilotkit_manually_emit_intermediate_state"
                )


                # we only want to update the node name under certain conditions
                # since we don't need any internal node names to be sent to the frontend
                if current_node_name in self.graph.nodes.keys():
                    node_name = current_node_name

                # we don't have a node name yet, so we can't update the state
                if node_name is None:
                    continue

                exiting_node = node_name == current_node_name and event_type == "on_chain_end"

                if exiting_node:
                    manually_emitted_state = None

                if manually_emit_intermediate_state:
                    manually_emitted_state = cast(Any, event["data"])
                    yield self._emit_state_sync_event(
                        thread_id=thread_id,
                        run_id=run_id,
                        node_name=node_name,
                        state=manually_emitted_state,
                        running=True,
                        active=True
                    ) + "\n"
                    continue


                if emit_intermediate_state and emit_intermediate_state_until_end is None:
                    emit_intermediate_state_until_end = node_name

                if emit_intermediate_state and event_type == "on_chat_model_start":
                    # reset the streaming state extractor
                    streaming_state_extractor = _StreamingStateExtractor(emit_intermediate_state)

                # OPTIMIZATION: Use locally maintained state instead of hitting checkpointer repeatedly
                updated_state = manually_emitted_state or current_graph_state

                if emit_intermediate_state and event_type == "on_chat_model_stream":
                    streaming_state_extractor.buffer_tool_calls(event)

                if emit_intermediate_state_until_end is not None:
                    updated_state = {
                        **updated_state,
                        **streaming_state_extractor.extract_state()
                    }

                if (not emit_intermediate_state and
                    current_node_name == emit_intermediate_state_until_end and
                    event_type == "on_chain_end"):
                    # stop emitting function call state
                    emit_intermediate_state_until_end = None

                # we send state sync events when:
                #   a) the state has changed
                #   b) the node has changed
                #   c) the node is ending
                if updated_state != state or prev_node_name != node_name or exiting_node:
                    state = updated_state
                    prev_node_name = node_name
                    current_graph_state.update(updated_state)
                    yield self._emit_state_sync_event(
                        thread_id=thread_id,
                        run_id=run_id,
                        node_name=node_name,
                        state=state,
                        running=True,
                        active=not exiting_node
                    ) + "\n"

                yield dumps(event) + "\n"
        except Exception as error:
            # Emit error information through streaming protocol before terminating
            # This preserves the semantic error details that would otherwise be lost
            error_message = str(error)
            error_type = type(error).__name__

            # Extract additional error details for common error types
            error_details = {
                "message": error_message,
                "type": error_type,
                "agent_name": self.name,
            }

            # Add specific details for OpenAI errors
            if hasattr(error, 'status_code'):
                error_details["status_code"] = error.status_code
            if hasattr(error, 'response') and hasattr(error.response, 'json'):
                try:
                    error_details["response_data"] = error.response.json()
                except:
                    pass

            # Emit error events in both formats to support both LangGraph Platform and direct LangGraph modes

            # Format for LangGraph Platform (remote-lg-action.ts)
            yield dumps({
                "event": "error",
                "data": {
                    "message": f"{error_type}: {error_message}",
                    "error_details": error_details,
                    "thread_id": thread_id,
                    "agent_name": self.name,
                    "node_name": node_name or "unknown"
                }
            }) + "\n"

            # Format for direct LangGraph mode (event-source.ts)
            yield dumps({
                "event": "on_copilotkit_error",
                "data": {
                    "error": error_details,
                    "thread_id": thread_id,
                    "agent_name": self.name,
                    "node_name": node_name or "unknown"
                }
            }) + "\n"

            # Re-raise the exception to maintain normal error handling flow
            raise

        state = await self.graph.aget_state(config)
        tasks = state.tasks
        interrupts = tasks[0].interrupts if tasks and len(tasks) > 0 else None
        if interrupts:
            # node_name is already set earlier from the interrupt origin
            pass
        elif "writes" in state.metadata and state.metadata["writes"]:
            node_name = list(state.metadata["writes"].keys())[0]
        elif hasattr(state, "next") and state.next and state.next[0]:
            node_name = state.next[0]
        else:
            node_name = "__end__"
        is_end_node = state.next == () and not interrupts

        yield self._emit_state_sync_event(
            thread_id=thread_id,
            run_id=run_id,
            node_name=cast(str, node_name) if not is_end_node else "__end__",
            state=state.values,
            running=not should_exit,
            # at this point, the node is ending so we set active to false
            active=False,
            # sync messages at the end of the run
            include_messages=True
        ) + "\n"

    def _emit_state_sync_event(
        self,
        *,
        thread_id: str,
        run_id: str,
        node_name: str,
        state: dict,
        running: bool,
        active: bool,
        include_messages: bool = False
    ):
        # First handle messages as before
        if not include_messages:
            state = {
                k: v for k, v in state.items() if k != "messages"
            }
        else:
            state = {
                **state,
                "messages": langchain_messages_to_copilotkit(state.get("messages", []))
            }

        # Filter by schema keys if available
        state = self.filter_state_on_schema_keys(state, 'output')

        return dumps({
            "event": "on_copilotkit_state_sync",
            "thread_id": thread_id,
            "run_id": run_id,
            "agent_name": self.name,
            "node_name": node_name,
            "active": active,
            "state": state,
            "running": running,
            "role": "assistant"
        })

    async def get_state(
        self,
        *,
        thread_id: str,
    ):
        if not thread_id:
            return {
                "threadId": "",
                "threadExists": False,
                "state": {},
                "messages": []
            }

        config = ensure_config(cast(Any, self.langgraph_config.copy()) if self.langgraph_config else {}) # pylint: disable=line-too-long
        config["configurable"] = config.get("configurable", {})
        config["configurable"]["thread_id"] = thread_id

        if self.thread_state.get(thread_id, None) is None:
            self.thread_state[thread_id] = {**(await self.graph.aget_state(config)).values}

        state = self.thread_state[thread_id]
        if state == {}:
            return {
                "threadId": thread_id or "",
                "threadExists": False,
                "state": {},
                "messages": []
            }

        messages = langchain_messages_to_copilotkit(state.get("messages", []))
        state_copy = state.copy()
        state_copy.pop("messages", None)

        return {
            "threadId": thread_id,
            "threadExists": True,
            "state": state_copy,
            "messages": messages
        }

    def dict_repr(self):
        super_repr = super().dict_repr()
        return {
            **super_repr,
            'type': 'langgraph'
        }

    def get_schema_keys(self, config):
        CONSTANT_KEYS = ['copilotkit', 'messages']
        CONSTANT_CONFIG_KEYS = ['checkpoint_id', 'checkpoint_ns', 'thread_id']
        try:
            input_schema = self.graph.get_input_jsonschema(config)
            output_schema = self.graph.get_output_jsonschema(config)
            input_schema_keys = list(input_schema["properties"].keys())
            output_schema_keys = list(output_schema["properties"].keys())

            try:
                schema_dict = self.graph.config_schema().schema()
                configurable_schema = schema_dict["$defs"]["Configurable"]
                config_schema_keys = list(configurable_schema["properties"].keys())

                # If only constant keys are present, it means no schema was passed, we allow everything
                if set(config_schema_keys) == set(CONSTANT_CONFIG_KEYS):
                    config_schema_keys = None
            except:
                config_schema_keys = None

            # We add "copilotkit" and "messages" as they are always sent and received.
            for key in CONSTANT_KEYS:
                if key not in input_schema_keys:
                    input_schema_keys.append(key)
                if key not in output_schema_keys:
                    output_schema_keys.append(key)

            return input_schema_keys, output_schema_keys, config_schema_keys
        except Exception:
            return None

    def filter_state_on_schema_keys(self, state, schema_type: Literal["input", "output"]):
        try:
            schema_keys_name = f"{schema_type}_schema_keys"
            if hasattr(self, schema_keys_name) and getattr(self, schema_keys_name):
                return filter_by_schema_keys(state, getattr(self, schema_keys_name))
        except Exception:
            return state

    def get_interrupt_event(self, value):
        if not isinstance(value, str) and "__copilotkit_interrupt_value__" in value:
            ev_value = value["__copilotkit_interrupt_value__"]
            return dumps({
                "event": "on_copilotkit_interrupt",
                "data": { "value": ev_value if isinstance(ev_value, str) else json.dumps(ev_value), "messages": langchain_messages_to_copilotkit(value["__copilotkit_messages__"]) }
            }) + "\n"
        else:
            return dumps({
                "event": "on_interrupt",
                "value": value if isinstance(value, str) else json.dumps(value)
            }) + "\n"

    async def get_checkpoint_before_message(self, message_id: str, thread_id: str):
        if not thread_id:
            raise ValueError("Missing thread_id in config")

        history_list = []
        async for snapshot in self.graph.aget_state_history({"configurable": {"thread_id": thread_id}}):
            history_list.append(snapshot)

        history_list.reverse()
        for idx, snapshot in enumerate(history_list):
            messages = snapshot.values.get("messages", [])
            if any(getattr(m, "id", None) == message_id for m in messages):
                if idx == 0:
                    # No snapshot before this
                    # Return synthetic "empty before" version
                    empty_snapshot = snapshot
                    empty_snapshot.values["messages"] = []
                    return empty_snapshot
                return history_list[idx - 1]  # return one snapshot *before* the one that includes the message

        raise ValueError("Message ID not found in history")

