/**
 * WebSocket客户端类
 * 用于管理与后端的WebSocket连接
 */

import { MessageType, WebSocketMessage, WebSocketConfig } from './types';

export interface WebSocketClientCallbacks {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private callbacks: WebSocketClientCallbacks;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(config: WebSocketConfig, callbacks: WebSocketClientCallbacks = {}) {
    this.config = {
      url: config.url,
      protocols: config.protocols || [],
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      heartbeatInterval: config.heartbeatInterval || 30000
    };
    this.callbacks = callbacks;
  }

  /**
   * 连接到WebSocket服务器
   */
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(error as Event);
    }
  }

  /**
   * 断开WebSocket连接
   */
  public disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.stopReconnect();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送文本消息
   */
  public send(message: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.warn('WebSocket is not connected, message not sent:', message);
    }
  }

  /**
   * 发送JSON消息
   */
  public sendJson(data: Record<string, any>): void {
    try {
      const message = JSON.stringify(data);
      this.send(message);
    } catch (error) {
      console.error('Failed to send JSON message:', error);
    }
  }

  /**
   * 发送聊天消息
   */
  public sendChatMessage(content: string): void {
    this.sendJson({
      type: MessageType.MESSAGE,
      content: content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发送心跳消息
   */
  public sendPing(): void {
    this.sendJson({
      type: MessageType.PING,
      content: '',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 清空历史消息
   */
  public clearHistory(): void {
    this.sendJson({
      type: MessageType.CLEAR_HISTORY,
      content: '',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取连接状态
   */
  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 是否已连接
   */
  public get isConnected(): boolean {
    return this.readyState === WebSocket.OPEN;
  }

  /**
   * 设置回调函数
   */
  public setCallbacks(callbacks: WebSocketClientCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.callbacks.onOpen?.(event);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected');
      this.stopHeartbeat();

      if (!this.isManualClose && this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      }

      this.callbacks.onClose?.(event);
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.handleError(event);
      this.callbacks.onError?.(event);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
        this.callbacks.onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    // 处理心跳响应
    if (message.type === MessageType.PONG) {
      console.log('Heartbeat pong received');
      return;
    }

    // 处理连接确认
    if (message.type === MessageType.CONNECTION) {
      console.log('Connection established:', message.content);
      return;
    }

    // 处理错误消息
    if (message.type === MessageType.ERROR) {
      console.error('Server error:', message.content);
      return;
    }

    // 处理历史清空确认
    if (message.type === MessageType.HISTORY_CLEARED) {
      console.log('History cleared:', message.content);
      return;
    }

    // 其他消息类型将通过回调函数处理
  }

  /**
   * 处理错误
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);

    if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    if (this.config.heartbeatInterval <= 0) return;

    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendPing();
      } else {
        this.stopHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.stopReconnect();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.callbacks.onReconnect?.(this.reconnectAttempts);
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * 停止重连
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}