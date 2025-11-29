/**
 * WebSocket消息类型定义
 */

// 消息类型枚举
export enum MessageType {
  // 客户端发送的消息类型
  MESSAGE = 'message',
  PING = 'ping',
  CLEAR_HISTORY = 'clear_history',

  // 服务端回复的消息类型
  CONNECTION = 'connection',
  PONG = 'pong',
  STREAM = 'stream',
  COMPLETE = 'complete',
  ERROR = 'error',
  PROCESSING_START = 'processing_start',
  HISTORY_CLEARED = 'history_cleared'
}

// WebSocket消息接口
export interface WebSocketMessage {
  type: MessageType | string;
  content: string;
  timestamp?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // 允许额外的字段
}

// 聊天消息接口
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// WebSocket配置接口
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

// WebSocket状态接口
export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sessionId: string | null;
  messages: ChatMessage[];
  isProcessing: boolean;
  reconnectAttempts: number;
}

// WebSocket钩子返回接口
export interface UseWebSocketReturn {
  state: WebSocketState;
  sendMessage: (message: string) => void;
  sendJsonMessage: (data: Record<string, any>) => void;
  clearHistory: () => void;
  disconnect: () => void;
  reconnect: () => void;
}