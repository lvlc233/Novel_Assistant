"""图日志处理器模块。.

本模块提供用于记录LangGraph节点执行和LLM调用的日志处理器。
"""

import copy
import json
from typing import cast

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.load import dumpd
from langchain_core.messages import AIMessage

from common.log.log import logger
from common.utils import (
    _safe_to_dict,
    get_run_id_for_node,
    pick_msg_fields,
    value_colour_for_dict,
)


class NodeLogHandler(BaseCallbackHandler):
    """节点日志处理器。.
    
    用于记录LangGraph节点开始和结束时的状态变化。
    """
    def on_chain_start(self, serialized, inputs, **kwargs):
        """Purpose: 记录节点调用开始时的输入."""
        # 非节点过滤
        tags = kwargs.get("tags")
        if tags and cast(str, tags[0]).split(":")[0] != "graph":
            return
        node_name = kwargs.get("name")
        # 获取run id
        current_run_id, parent_run_id = get_run_id_for_node(kwargs)

        # 以下处理的原因是防止系统状态被修改
        # 获取其他状态
        state_dict = _safe_to_dict(inputs)
        other_state = {k: v for k, v in state_dict.items() if k != "messages"}
        # 对 other_state 进行深拷贝后上色，避免修改原始对象
        other_state_colored = value_colour_for_dict(copy.deepcopy(other_state), colour="green")

        # 安全构造 messages：先判断 inputs 是否包含消息并且消息有效
        messages = []
        if getattr(inputs, "messages", None):
            for m in inputs.messages:
                data = dumpd(m)
                kw = data.get("kwargs")
                # 判断 message 是否存在且为字典
                if not kw or not isinstance(kw, dict):
                    continue
                msg = pick_msg_fields(kw, content="content", type="type", id="id")
                if not msg:
                    continue
                messages.append(msg)
        # 对 messages 中的内容上色（保持原有行为）
        for i, msg in enumerate(messages):
            messages[i] = value_colour_for_dict(msg, colour="green")

        # 合并字典，确保messages在第一条
        if messages:
            merged_state = {"messages": messages} | other_state_colored
        else:
            merged_state = other_state_colored

        logger.opt(ansi=True).info(f"""
    <bold><bg green>START NODE:</bg green></bold>
        <bold>{node_name}:</bold>
        <bold>RUN ID:</bold> {current_run_id}
        <bold>PARENT RUN ID:</bold> {parent_run_id}
        <bold>STATE</bold>: {json.dumps(merged_state, indent=4, ensure_ascii=False)}
                """)

    def on_chain_end(self, outputs, **kwargs):
        """Purpose: 记录节点调用结束时的输出."""
        # 非节点过滤
        tags = kwargs.get("tags")
        if tags and cast(str, tags[0]).split(":")[0] != "graph":
            return
        # 这里只能获取UUID,不能获取名字,相同节点的RUN ID是相同的
        # 获取run id
        current_run_id, parent_run_id = get_run_id_for_node(kwargs)
        # 过滤信息,注意,节点的输入和输出不太一样,所以需要额外处理一步,差异在output的结果并不是全部的状态,或可在graph中仅仅传State,但是这样子就必须维护超步问题
        state_dict = _safe_to_dict(outputs)
        other_state = {k: v for k, v in state_dict.items() if k != "messages"}
        # 深拷贝后上色，避免改写输出状态
        other_state_colored = value_colour_for_dict(copy.deepcopy(other_state), colour="green") if other_state else {}

        # 安全构造 messages：先判断 inputs 是否包含消息并且消息有效
        messages = []
        if getattr(outputs, "messages", None):
            for m in outputs.messages:
                data = dumpd(m)
                kw = data.get("kwargs")
                # 判断 message 是否存在且为字典
                if not kw or not isinstance(kw, dict):
                    continue
                msg = pick_msg_fields(kw, content="content", type="type", id="id")
                if not msg:
                    continue
                messages.append(msg)
        # 对 messages 中的内容上色（保持原有行为）
        for i, msg in enumerate(messages):
            messages[i] = value_colour_for_dict(msg, colour="green")

        # 合并字典，确保messages在第一条
        if messages:
            merged_state = {"messages": messages} | other_state_colored
        else:
            merged_state = other_state_colored
        logger.opt(ansi=True).info(f"""
    <bold><bg white>NODE END:</bg white></bold>
        <bold>RUN ID:</bold> {current_run_id}
        <bold>PARENT RUN ID:</bold> {parent_run_id}
        <bold>UPDATE STATE</bold>: {json.dumps(merged_state, indent=4, ensure_ascii=False)}
                        """)


class LLMLogHandler(BaseCallbackHandler):
    """LLM日志处理器。.
    
    用于记录LLM模型的输入和输出。
    """
    def on_llm_start(self, serialized, prompts, **kwargs):
        """Purpose: 记录 LLM 调用开始时的输入."""
        run_id = kwargs["run_id"]
        prompt_str = "\n".join([p for p in prompts])
        in_node = kwargs["metadata"]["langgraph_node"]
        provider = kwargs["metadata"]["ls_provider"]
        model_name = kwargs["metadata"]["ls_model_name"]
        invoke_params = value_colour_for_dict(
            copy.deepcopy(kwargs["invocation_params"]), colour="green"
        )
        logger.opt(ansi=True).info(f"""
    <bold><bg green>LLM INVOKE:</bg green></bold>
        <bold>RUN ID:</bold> <green>{run_id}</green>
        <bold>IN NODE:</bold> <green>{in_node}</green>
        <bold>PROVIDER:</bold> <green>{provider}</green>
        <bold>MODEL NAME:</bold> <green>{model_name}</green>
        <bold>INVOKE PARAMS</bold>: {json.dumps(invoke_params, indent=4, ensure_ascii=False)}
        <bold>PROMPTS:</bold> <green>{prompt_str}</green>
                        """)

    def on_llm_end(self, outputs, **kwargs):
        """Purpose: 记录 LLM 调用结束时的输出."""
        run_id = kwargs["run_id"]
        # 批次取首

        generation = outputs.generations[0][0]

        output_message = cast(AIMessage, generation.message)
        model_name = output_message.response_metadata["model_name"]
        content = output_message.content
        additional_kwargs = output_message.additional_kwargs
        additional_kwargs = value_colour_for_dict(copy.deepcopy(additional_kwargs), colour="green")
        token_usage = value_colour_for_dict(copy.deepcopy(outputs.llm_output["token_usage"]), colour="green")
        logger.opt(ansi=True).info(f"""
    <bold><bg white>LLM END:</bg white></bold>
        <bold>RUN ID:</bold> <green>{run_id}</green>
        <bold>MODEL NAME:</bold> <green>{model_name}</green>
        <bold>TEXT:</bold> <green>{content}</green>
        <bold>ADDITIONAL KWARGS:</bold> {json.dumps(additional_kwargs, indent=4, ensure_ascii=False)}
        <bold>TOKEN USAGE:</bold> {json.dumps(token_usage, indent=4, ensure_ascii=False)}
                        """)

    def on_llm_error(self, error, **kwargs):
        """Purpose: 记录 LLM 调用出错时的错误信息."""
        err_kw = value_colour_for_dict(kwargs["invocation_params"], colour="red")
        logger.error(f"""
    <bold><bg red>LLM INVOKE:</bg red></bold>
        <bold>ERROR:</bold> <red>{error}</red>
        <bold>ERROR KWARGS:</bold> {json.dumps(err_kw, indent=4, ensure_ascii=False)}
    """)
