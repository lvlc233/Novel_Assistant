"""
WebSocket连接测试脚本
用于验证后端WebSocket功能是否正常工作
"""

import asyncio
import json
import websockets
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket服务器配置
WS_URL = "ws://localhost:8000/chat/api/v1/ws/chat"
HTTP_URL = "http://localhost:8000/chat/api/v1"


async def test_websocket_connection():
    """测试WebSocket连接"""
    session_id = f"test-session-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    uri = f"{WS_URL}/{session_id}"

    try:
        logger.info(f"正在连接到WebSocket服务器: {uri}")

        async with websockets.connect(uri) as websocket:
            logger.info(f"成功连接到会话: {session_id}")

            # 等待连接确认消息
            try:
                connection_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                connection_data = json.loads(connection_msg)
                logger.info(f"收到连接确认: {connection_data}")
            except asyncio.TimeoutError:
                logger.warning("等待连接确认超时")

            # 发送测试消息
            test_messages = [
                "你好，请介绍一下你自己",
                "我正在写一本小说，需要一些角色设定的建议",
                "如何构建一个引人入胜的故事情节？",
            ]

            for i, test_msg in enumerate(test_messages, 1):
                logger.info(f"\n--- 测试消息 {i}/{len(test_messages)} ---")
                logger.info(f"发送消息: {test_msg}")

                # 发送消息
                message_data = {
                    "type": "message",
                    "content": test_msg
                }
                await websocket.send(json.dumps(message_data))

                # 接收响应
                logger.info("等待AI响应...")
                full_response = ""
                chunk_count = 0

                while True:
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                        response_data = json.loads(response)

                        msg_type = response_data.get("type")

                        if msg_type == "processing_start":
                            logger.info("AI开始处理消息...")

                        elif msg_type == "stream":
                            chunk = response_data.get("content", "")
                            full_response += chunk
                            chunk_count += 1
                            logger.debug(f"收到响应块 {chunk_count}: {chunk[:50]}...")

                        elif msg_type == "complete":
                            logger.info(f"响应完成! 总共收到 {chunk_count} 个块，长度: {len(full_response)}")
                            logger.info(f"完整响应: {full_response[:200]}...")
                            break

                        elif msg_type == "error":
                            error_msg = response_data.get("content", "未知错误")
                            logger.error(f"收到错误: {error_msg}")
                            break

                        else:
                            logger.debug(f"收到其他类型消息: {msg_type} - {response_data}")

                    except asyncio.TimeoutError:
                        logger.error("等待响应超时")
                        break

                # 等待一下再发送下一条消息
                if i < len(test_messages):
                    await asyncio.sleep(2)

            # 发送心跳测试
            logger.info("\n--- 心跳测试 ---")
            ping_data = {
                "type": "ping",
                "content": ""
            }
            await websocket.send(json.dumps(ping_data))

            try:
                pong_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                pong_data = json.loads(pong_response)
                if pong_data.get("type") == "pong":
                    logger.info("心跳测试通过")
                else:
                    logger.warning(f"心跳响应异常: {pong_data}")
            except asyncio.TimeoutError:
                logger.error("心跳测试超时")

            logger.info("WebSocket连接测试完成")

    except Exception as e:
        logger.error(f"WebSocket测试失败: {e}")
        return False

    return True


async def test_http_endpoints():
    """测试HTTP端点"""
    import aiohttp

    logger.info("\n--- 测试HTTP端点 ---")

    try:
        async with aiohttp.ClientSession() as session:
            # 测试健康检查
            health_url = f"{HTTP_URL}/ws/health"
            logger.info(f"测试健康检查: {health_url}")

            async with session.get(health_url) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"健康检查通过: {data}")
                else:
                    logger.error(f"健康检查失败: {response.status}")

            # 测试创建会话
            session_url = f"{HTTP_URL}/ws/session"
            logger.info(f"测试创建会话: {session_url}")

            async with session.post(session_url) as response:
                if response.status == 200:
                    data = await response.json()
                    new_session_id = data.get("data", {}).get("session_id")
                    logger.info(f"创建会话成功: {new_session_id}")

                    # 测试获取历史消息（新会话应该为空）
                    history_url = f"{HTTP_URL}/ws/history/{new_session_id}"
                    logger.info(f"测试获取历史消息: {history_url}")

                    async with session.get(history_url) as history_response:
                        if history_response.status == 200:
                            history_data = await history_response.json()
                            logger.info(f"历史消息获取成功: {history_data}")
                        else:
                            logger.error(f"历史消息获取失败: {history_response.status}")
                else:
                    logger.error(f"创建会话失败: {response.status}")

            # 测试统计信息
            stats_url = f"{HTTP_URL}/ws/stats"
            logger.info(f"测试统计信息: {stats_url}")

            async with session.get(stats_url) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"统计信息获取成功: {data}")
                else:
                    logger.error(f"统计信息获取失败: {response.status}")

    except Exception as e:
        logger.error(f"HTTP端点测试失败: {e}")
        return False

    return True


async def main():
    """主测试函数"""
    logger.info("=" * 50)
    logger.info("WebSocket连接测试开始")
    logger.info("=" * 50)

    start_time = datetime.now()

    # 测试HTTP端点
    http_test_passed = await test_http_endpoints()

    # 测试WebSocket连接
    ws_test_passed = await test_websocket_connection()

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    logger.info("=" * 50)
    logger.info("WebSocket连接测试完成")
    logger.info(f"总耗时: {duration:.2f}秒")
    logger.info(f"HTTP测试: {'通过' if http_test_passed else '失败'}")
    logger.info(f"WebSocket测试: {'通过' if ws_test_passed else '失败'}")
    logger.info("=" * 50)

    if http_test_passed and ws_test_passed:
        logger.info("✅ 所有测试通过!")
        return 0
    else:
        logger.error("❌ 部分测试失败!")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        exit(exit_code)
    except KeyboardInterrupt:
        logger.info("测试被用户中断")
        exit(1)
    except Exception as e:
        logger.error(f"测试过程发生错误: {e}")
        exit(1)