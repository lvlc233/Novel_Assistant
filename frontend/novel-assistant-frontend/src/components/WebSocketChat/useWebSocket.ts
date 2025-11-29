/**
 * WebSocket React Hook
 * 用于在React组件中使用WebSocket连接
 */

"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketClient } from './WebSocketClient';
import { MessageType, WebSocketMessage, ChatMessage, WebSocketConfig, WebSocketState, UseWebSocketReturn } from './types';

export interface UseWebSocketOptions extends Partial<WebSocketConfig> {
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useWebSocket(sessionId: string, options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = `ws://localhost:8001/chat/api/v1/ws/chat/${sessionId}`,
    autoConnect = true,
    reconnect: enableReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const clientRef = useRef<WebSocketClient | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    sessionId,
    messages: [],
    isProcessing: false,
    reconnectAttempts: 0
  });

  // 创建WebSocket客户端
  const createClient = useCallback(() => {
    const client = new WebSocketClient(
      {
        url,
        reconnect: enableReconnect,
        reconnectInterval,
        maxReconnectAttempts,
        heartbeatInterval
      },
      {
        onOpen: () => {
          setState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            error: null,
            reconnectAttempts: 0
          }));
          onConnect?.();
        },
        onClose: () => {
          setState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
            isProcessing: false
          }));
          onDisconnect?.();
        },
        onError: (event) => {
          const error = 'WebSocket connection error';
          setState(prev => ({
            ...prev,
            error
          }));
          onError?.(error);
        },
        onMessage: (message) => {
          handleWebSocketMessage(message);
          onMessage?.(message);
        },
        onReconnect: (attempt) => {
          setState(prev => ({
            ...prev,
            isConnecting: true,
            reconnectAttempts: attempt
          }));
        }
      }
    );

    clientRef.current = client;
    return client;
  }, [url, enableReconnect, reconnectInterval, maxReconnectAttempts, heartbeatInterval, onConnect, onDisconnect, onError, onMessage]);

  // 处理WebSocket消息
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case MessageType.CONNECTION:
        console.log('Connected to server:', message.content);
        break;

      case MessageType.PROCESSING_START:
        setState(prev => ({
          ...prev,
          isProcessing: true
        }));
        break;

      case MessageType.STREAM:
        // 流式消息，累积到最新消息中
        setState(prev => {
          const updatedMessages = [...prev.messages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];

          if (lastMessage?.role === 'assistant' && !lastMessage.timestamp) {
            // 更新现有的assistant消息
            lastMessage.content += message.content;
          } else {
            // 创建新的assistant消息
            updatedMessages.push({
              role: 'assistant',
              content: message.content,
              timestamp: message.timestamp || new Date().toISOString()
            });
          }

          return {
            ...prev,
            messages: updatedMessages
          };
        });
        break;

      case MessageType.COMPLETE:
        setState(prev => {
          const updatedMessages = [...prev.messages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];

          if (lastMessage?.role === 'assistant') {
            // 完成消息，添加时间戳
            lastMessage.timestamp = message.timestamp || new Date().toISOString();
          }

          return {
            ...prev,
            messages: updatedMessages,
            isProcessing: false
          };
        });
        break;

      case MessageType.ERROR:
        setState(prev => ({
          ...prev,
          error: message.content,
          isProcessing: false
        }));
        break;

      case MessageType.HISTORY_CLEARED:
        setState(prev => ({
          ...prev,
          messages: []
        }));
        break;

      case MessageType.PONG:
        // 心跳响应，忽略
        break;

      default:
        console.log('Unknown message type:', message.type, message);
    }
  }, []);

  // 发送聊天消息
  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current || !state.isConnected) {
      console.warn('WebSocket is not connected');
      return;
    }

    // 添加用户消息到状态
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // 发送消息到服务器
    clientRef.current.sendChatMessage(content);
  }, [state.isConnected]);

  // 发送JSON消息
  const sendJsonMessage = useCallback((data: Record<string, any>) => {
    if (!clientRef.current || !state.isConnected) {
      console.warn('WebSocket is not connected');
      return;
    }

    clientRef.current.sendJson(data);
  }, [state.isConnected]);

  // 清空历史消息
  const clearHistory = useCallback(() => {
    if (!clientRef.current || !state.isConnected) {
      console.warn('WebSocket is not connected');
      return;
    }

    clientRef.current.clearHistory();
  }, [state.isConnected]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // 重新连接
  const reconnect = useCallback(() => {
    disconnect();
    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));
    const client = createClient();
    client.connect();
  }, [createClient, disconnect]);

  // 初始化连接
  useEffect(() => {
    if (autoConnect) {
      const client = createClient();
      client.connect();
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [autoConnect, createClient]);

  return {
    state,
    sendMessage,
    sendJsonMessage,
    clearHistory,
    disconnect,
    reconnect
  };
}

// 创建会话ID的工具函数
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 获取WebSocket URL的工具函数
export function getWebSocketUrl(sessionId: string, baseUrl = 'ws://localhost:8001'): string {
  return `${baseUrl}/chat/api/v1/ws/chat/${sessionId}`;
}

// 获取HTTP API URL的工具函数
export function getApiUrl(endpoint: string, baseUrl = 'http://localhost:8001'): string {
  return `${baseUrl}/chat/api/v1${endpoint}`;
}