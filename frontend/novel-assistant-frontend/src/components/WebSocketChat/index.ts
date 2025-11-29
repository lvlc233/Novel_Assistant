/**
 * WebSocketChat组件导出
 */

export { ChatInterface } from './ChatInterface';
export { useWebSocket, generateSessionId, getWebSocketUrl, getApiUrl } from './useWebSocket';
export { WebSocketClient } from './WebSocketClient';
export { MessageType } from './types';
export type {
  WebSocketMessage,
  ChatMessage,
  WebSocketConfig,
  WebSocketState,
  UseWebSocketReturn,
  UseWebSocketOptions
} from './types';