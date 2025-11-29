/**
 * WebSocket聊天组件使用示例
 * 展示如何在现有应用中集成WebSocket聊天功能
 */

import React, { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { useWebSocket, generateSessionId } from './useWebSocket';

// 示例1: 独立聊天界面
export const StandaloneChatExample: React.FC = () => {
  const [sessionId] = useState(() => generateSessionId());

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">AI助手聊天</h2>
      <ChatInterface
        sessionId={sessionId}
        height="500px"
        className="shadow-lg"
      />
    </div>
  );
};

// 示例2: 自定义聊天界面
export const CustomChatExample: React.FC = () => {
  const sessionId = 'custom-session-123';
  const {
    state,
    sendMessage,
    clearHistory,
    disconnect,
    reconnect
  } = useWebSocket(sessionId, {
    autoConnect: true,
    reconnect: true,
    onConnect: () => console.log('Connected!'),
    onDisconnect: () => console.log('Disconnected!'),
    onError: (error) => console.error('Error:', error),
    onMessage: (message) => console.log('Message:', message)
  });

  const [inputMessage, setInputMessage] = useState('');

  const handleSend = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">自定义聊天界面</h3>
        <div className="flex gap-2">
          <button
            onClick={clearHistory}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            清空历史
          </button>
          <button
            onClick={state.isConnected ? disconnect : reconnect}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {state.isConnected ? '断开' : '连接'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded p-3 mb-4 h-64 overflow-y-auto">
        {state.messages.length === 0 ? (
          <p className="text-gray-500 text-center">暂无消息</p>
        ) : (
          state.messages.map((message, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-auto max-w-xs'
                  : 'bg-gray-100 mr-auto max-w-xs'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}

        {state.isProcessing && (
          <div className="text-center text-gray-500">
            AI正在思考...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
          disabled={!state.isConnected || state.isProcessing}
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={!inputMessage.trim() || !state.isConnected || state.isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>

      {state.error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}
    </div>
  );
};

// 示例3: 与现有组件集成
export const IntegratedChatExample: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const sessionId = generateSessionId();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">我的应用</h2>
        <button
          onClick={() => setShowChat(!showChat)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {showChat ? '隐藏' : '显示'}聊天助手
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">主要内容区域</h3>
          <p className="text-gray-600">
            这里可以放置你的主要应用内容，比如文档编辑器、数据表格等。
          </p>
        </div>

        {showChat && (
          <div className="bg-white rounded shadow">
            <ChatInterface
              sessionId={sessionId}
              height="400px"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// 示例4: 状态监控组件
export const ConnectionMonitor: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const { state } = useWebSocket(sessionId, {
    autoConnect: true,
    reconnect: true
  });

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border">
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${
          state.isConnected ? 'bg-green-500' : state.isConnecting ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <span>
          {state.isConnected ? '已连接' : state.isConnecting ? '连接中...' : '未连接'}
        </span>
        {state.reconnectAttempts > 0 && (
          <span className="text-yellow-600">
            (重连 {state.reconnectAttempts} 次)
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        会话: {sessionId.slice(0, 8)}...
      </div>
    </div>
  );
};