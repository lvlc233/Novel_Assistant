/**
 * WebSocket测试页面
 * 用于测试前后端WebSocket连接
 */

import React from 'react';
import { ChatInterface } from '@/components/WebSocketChat';

export default function WebSocketTestPage() {
  // 生成一个随机的会话ID用于测试
  const sessionId = `test-session-${Date.now()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              WebSocket连接测试
            </h1>
            <p className="mt-2 text-gray-600">
              测试前后端WebSocket通信功能，基于LangChain 1.0的create_agent实现
            </p>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* 聊天界面 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  AI助手聊天界面
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  会话ID: {sessionId}
                </p>
              </div>

              <div className="p-6">
                <ChatInterface
                  sessionId={sessionId}
                  height="600px"
                  placeholder="输入您的问题，AI助手将基于小说创作知识回答..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              实时通信
            </h3>
            <p className="text-gray-600">
              使用WebSocket协议实现前后端实时双向通信，支持流式响应。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              智能助手
            </h3>
            <p className="text-gray-600">
              基于LangChain 1.0的create_agent构建的小说创作AI助手，提供专业的创作建议。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              会话管理
            </h3>
            <p className="text-gray-600">
              支持多会话管理、消息历史记录、会话状态监控等功能。
            </p>
          </div>
        </div>

        {/* 技术信息 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            技术实现
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>后端:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>FastAPI WebSocket端点</li>
                <li>LangChain 1.0 create_agent</li>
                <li>聊天助手Agent (chat_helper_graph)</li>
                <li>会话管理和历史记录</li>
              </ul>
            </div>
            <div>
              <strong>前端:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>React WebSocket Hook</li>
                <li>TypeScript类型安全</li>
                <li>自动重连和心跳机制</li>
                <li>响应式UI组件</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 添加页面的元数据
export const metadata = {
  title: 'WebSocket测试 - Novel Assistant',
  description: '测试前后端WebSocket连接和AI助手功能'
};