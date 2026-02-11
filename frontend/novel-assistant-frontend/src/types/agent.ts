/**
 * Agent 领域模型定义
 * 
 * 该文件定义了与 Agent（智能体）相关的前端业务模型。
 * 主要用于 Agent 管理页面的列表展示、详情查看、创建/编辑表单以及对话交互。
 * 包含 Agent 的基础元数据、详细配置、对话消息结构以及 SSE 流式响应格式。
 */

/**
 * Agent 基础元数据
 * 用于列表展示等轻量级场景
 */
export interface AgentMeta {
  /** Agent 唯一标识符 (UUID) */
  agent_id: string;
  /** 是否启用该 Agent */
  enable: boolean;
  /** Agent 名称 */
  agent_name: string;
  /** 是否广播消息 (通常用于群聊场景) */
  broadcast: boolean;
  /** Agent 描述信息 */
  agent_description?: string;
  /** 创建时间 (ISO 8601 格式字符串) */
  create_at: string;
}

/**
 * Agent 详细信息
 * 用于详情页展示，包含完整的配置信息和历史会话元数据
 */
export interface AgentDetail extends AgentMeta {
  /** Agent 类型 (如: role_play, assistant 等) */
  agent_type: string;
  /** 
   * 历史会话元数据 
   * 键为 session_id，值为简化的消息列表或其他元数据
   */
  history_meta: Record<string, unknown[]>;
}

/**
 * Agent 对话消息结构
 * 表示一条对话记录
 */
export interface AgentMessage {
  /** 消息发送者角色 */
  role: 'user' | 'assistant' | 'system';
  /** 消息内容 */
  content: string;
  /** 消息时间戳 */
  timestamp?: string;
}

/**
 * Agent 会话结构
 * 表示一个完整的对话上下文
 */
export interface AgentSession {
  /** 会话唯一标识符 */
  session_id: string;
  /** 消息列表 */
  messages: AgentMessage[];
  /** 最后更新时间 */
  updated_at: string;
}

/**
 * 发送消息请求载荷
 * 用于向 Agent 发送用户输入
 */
export interface MessagesSendRequest {
  /** 消息类型 (目前仅支持文本) */
  messages_type: 'text';
  /** 用户输入的上下文内容 */
  context: string;
}

/**
 * 创建 Agent 请求载荷
 * 用于新建 Agent
 */
export interface AgentCreateRequest {
  /** Agent 名称 */
  agent_name: string;
  /** Agent 类型 */
  agent_type: string;
  /** Agent 描述 */
  agent_description?: string;
  /** 是否广播 */
  broadcast?: boolean;
}

/**
 * 更新 Agent 请求载荷
 * 用于修改 Agent 配置
 */
export interface AgentUpdateRequest {
  /** 是否广播 */
  broadcast?: boolean;
}

/**
 * Agent SSE 流式响应事件结构
 * 用于处理服务端推送的实时对话流
 */
export interface AgentStreamEvent {
  /** 事件 ID */
  id: string;
  /** 事件类型: token(生成的文本片段), error(错误), finish(生成结束) */
  event: 'token' | 'error' | 'finish';
  /** 事件数据: JSON 字符串或纯文本(取决于事件类型) */
  data: string;
}
