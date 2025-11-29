/**
 * WebSocket聊天界面组件
 * 提供完整的聊天界面功能
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket, generateSessionId } from './useWebSocket';
import { MessageType } from './types';
import { Send, Loader2, Wifi, WifiOff, Trash2, RotateCcw } from 'lucide-react';

export interface ChatInterfaceProps {
  sessionId?: string;
  height?: string | number;
  placeholder?: string;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId: externalSessionId,
  height = '400px',
  placeholder = '输入消息...',
  className = ''
}) => {
  const [sessionId] = useState(() => externalSessionId || generateSessionId());
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    sendMessage,
    clearHistory,
    disconnect,
    reconnect
  } = useWebSocket(sessionId, {
    autoConnect: true,
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
  });

  const { isConnected, isConnecting, error, messages, isProcessing } = state;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = () => {
    const content = inputMessage.trim();
    if (!content || isProcessing) return;

    sendMessage(content);
    setInputMessage('');
  };

  // 处理输入框回车
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 连接状态指示器
  const ConnectionStatus = () => {
    if (isConnecting) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">连接中...</span>
        </div>
      );
    }

    if (isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="h-4 w-4" />
          <span className="text-sm">已连接</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-600">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">未连接</span>
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-white border rounded-lg shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">AI助手</h3>
          <ConnectionStatus />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            disabled={!isConnected || messages.length === 0}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 transition-colors"
            title="清空历史"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={isConnected ? disconnect : reconnect}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100 transition-colors"
            title={isConnected ? '断开连接' : '重新连接'}
          >
            {isConnected ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>{isConnected ? '开始与AI助手对话...' : '正在连接服务器...'}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.timestamp && (
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        {/* 正在处理指示器 */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={!isConnected || isProcessing}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected || isProcessing}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;