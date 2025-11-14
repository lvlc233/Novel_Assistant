# """Chat router for handling conversation endpoints."""




# import uuid
# from typing import Dict,List

# from fastapi import APIRouter
# from pydantic import BaseModel, Field, ConfigDict


# from langchain_core.messages import AIMessage
# from core.agent import ChatGraph
# from common.context import ChatContext
# from common.prompts import INITIAL_PROMPT
# # from common.log import NodeLogHandler, LLMLogHandler
# from ..models import (
#     InitSessionData,
#     ChatHistory,
#     LoadSessionRequest,
#     Response,
#     ChatMessage,
#     ChatRequest,
#     ChatMessageToSend
# ) 

# from api.models import Order,Spec,BaseDishesInfo,MerchantInfo


# router = APIRouter(tags=["chat"])
# # 后面用redis来做缓存
# session_cache: Dict[str, List[str]] = {}

# @router.get("/init/{user_id}", response_model=Response[InitSessionData], response_model_by_alias=True)
# async def init_session(user_id: str) -> Response[InitSessionData]:
#     """初始化会话."""
#     session_id = str(uuid.uuid4())
#     ai_first_message = AIMessage(content=INITIAL_PROMPT)
#     chat_msg = ChatMessage.from_message(ai_first_message)
#     session_ids=session_cache.get(user_id, [])
#     session_ids.append(session_id)
#     session_cache[user_id]=session_ids
#     return Response.ok(
#         InitSessionData(
#             session_id=session_id,
#             message=chat_msg,
#         )
#     )





# @router.get("/getHistory/{user_id}", response_model=Response[List[ChatHistory]], response_model_by_alias=True)
# async def get_user_history(user_id: str) -> Response[List[ChatHistory]]:
#     """获取会话历史."""
#     session_ids=session_cache.get(user_id, [])
#     histories=[]
#     for session_id in session_ids:
#         history = load_session(session_id)
#         histories.append(
#             ChatHistory(
#                 session_id=session_id,
#                 messages=history,
#             )
#         )
    
#     return Response.ok(histories)
#     # session_id = await chat_business_client.get_user_session(user_id)
#     # return Response.ok(
#     #     ChatHistory(
#     #         session_id=session_id,
#     #     )
#     # )

# @router.post("/chat/load_session", response_model_by_alias=True)
# async def load_session(request: LoadSessionRequest):
#     """加载会话"""
#     snapshot = await chat_graph.aget_state({"configurable": {"thread_id": request.session_id}})
#     print(snapshot)
#     history = [ChatMessage.from_ai_message(m) for m in snapshot.values.get("messages", [])]

#     return history

# @router.post("/sendMessage", response_model_by_alias=True)
# async def send_message(request: ChatRequest) -> Response[ChatMessageToSend]:
#     """发送消息"""
#     # user_id = await chat_business_client.get_user_id_by_session_id(request.session_id)
#     # if user_id is None:
#     #     if request.session_id not in session_cache.values():
#     #         raise SessionNotFoundError(request.session_id)
#     # 上下文后面也用redis缓存下比较好
#     # context = ChatContext(
#     #     session_id=request.session_id,
#     #     # user_id=user_id,
#     #     user_id="111",
#     #     current_position_id=request.current_position_id,
#     #     )
#     # chat_graph=await ChatGraph().abuild()
#     # result = await chat_graph.ainvoke(
#     #     {
#     #         "message": request.query,
#     #     },
#     #     # 日志和线程
#     #     config={
#     #         "configurable": {
#     #             "thread_id": request.session_id,
#     #         },
#     #         "callbacks": [NodeLogHandler(), LLMLogHandler()],
#     #     },
#     #     context=context
#     # )

    
#     chat_msg = ChatMessageToSend.from_message(AIMessage(content="你好"))
#     recommend_queries = ["推荐一道菜品", "推荐一道主食","推荐一道饮料"]
#     extra_type="order"
#     extra_info = Order(
#             good_info=BaseDishesInfo(
#                 good_id=1,
#                 good_name="鱼香肉丝",
#                 good_type="主餐",
#                 good_description="鱼香肉丝是一道传统的中国名菜，由鱼香肉丝和葱、姜、蒜、料酒腌制后，用大火煎香，再用油下锅翻炒，最后加入盐、味精、料酒，再翻炒均匀，即可出锅。",
#                 food_type="主餐",
#                 good_price=1000,
#                 good_specs=[
#                     Spec(
#                         spec_name="辣度",
#                         spec_value="中",
#                     ),
#                 ],
#                 hot_degree=3,
#                 good_image="https://example.com/fish_fried_rice.jpg",
#             ),
#             merchant_info=MerchantInfo(
#                 id=1,
#                 merchant_name="鱼香肉丝餐厅",
#             ),
#             use_data="2023-12-12 10:00:00",
#             interval_no=1
#         ),

#     is_end=False
#     chat_msg.recommend_queries=recommend_queries
#     chat_msg.extra_type=extra_type
#     chat_msg.extra_info = extra_info
#     chat_msg.is_end=is_end
#     chat_msg.extra_id=1
#     print(chat_msg)
#     return Response.ok(
#         chat_msg
#     )



# @router.post("/chat/userAciton/refreshRecommendationsDishes", response_model_by_alias=True)
# async def refresh_recommendations_dishes(request: ChatRequest):
#     """刷新推荐菜品"""
#     await chat_business_client.create_user_session(request.session_id, request.user_id)
#     context = ChatContext()
#     result = await chat_graph.ainvoke(
#         {
#             "message": request.message,
#         },
#         config={
#             "configurable": {
#                 "thread_id": request.session_id,
#             }
#         },
#         context=context
#     )


#     return result


# @router.post("/chat/userAciton/confirmOrderInfo", response_model_by_alias=True)
# async def confirm_order_info(request: ChatRequest):
#     """确认订单信息"""
#     await chat_business_client.create_user_session(request.session_id, request.user_id)
#     context = ChatContext()
#     result = await chat_graph.ainvoke(
#         {
#             "message": request.message,
#         },
#         config={
#             "configurable": {
#                 "thread_id": request.session_id,
#             }
#         },
#         context=context
#     )


#     return result


# @router.post("/chat/userAciton/CancelOrder", response_model_by_alias=True)
# async def cancel_order(request: ChatRequest):
#     """取消订单"""
#     await chat_business_client.create_user_session(request.session_id, request.user_id)
#     context = ChatContext()
#     result = await chat_graph.ainvoke(
#         {
#             "message": request.message,
#         },
#         config={
#             "configurable": {
#                 "thread_id": request.session_id,
#             }
#         },
#         context=context
#     )


#     return result
