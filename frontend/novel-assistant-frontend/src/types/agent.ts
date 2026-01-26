export interface AgentMeta {
  agent_id: string; // UUID
  enable: boolean;
  agent_name: string;
  broadcast: boolean;
  agent_description?: string;
  create_at: string; // datetime
}

export interface AgentDetail extends AgentMeta {
  agent_type: string;
  history_meta: Record<string, unknown[]>; // sessionId -> messageList (simplified)
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AgentSession {
  session_id: string;
  messages: AgentMessage[];
  updated_at: string;
}

export interface MessagesSendRequest {
  messages_type: 'text';
  context: string; // The user input or context
}

export interface AgentCreateRequest {
  agent_name: string;
  agent_type: string;
  agent_description?: string;
  broadcast?: boolean;
}

export interface AgentUpdateRequest {
  broadcast?: boolean;
}

// For SSE events
export interface AgentStreamEvent {
  id: string;
  event: 'token' | 'error' | 'finish';
  data: string; // JSON string or raw text depending on event
}
