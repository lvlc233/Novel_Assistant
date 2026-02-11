import { request } from '@/lib/request';
import { config } from '@/config';
import { 
  AgentMeta, 
  AgentDetail, 
  AgentUpdateRequest, 
  MessagesSendRequest,
  AgentMessage,
  AgentCreateRequest
} from '@/types/agent';
import { ErrorCodes } from '@/lib/error';

// Feature flag for using mock data
const USE_MOCK = false;

// Backend DTOs
interface AgentResponse {
  id: string;
  name: string;
  description?: string;
  agent_type: string;
  enabled: boolean;
  broadcast: boolean;
  config: Record<string, any>;
}

interface InvokeAgentResponse {
  output: Record<string, any>;
}

// Mock data (kept for fallback/testing)
const mockAgents: AgentDetail[] = [
  {
    agent_id: '1',
    enable: true,
    agent_name: 'Work Writer',
    broadcast: false,
    agent_type: 'writer',
    agent_description: 'Specializes in writing work chapters based on outlines.',
    create_at: new Date().toISOString(),
    history_meta: {}
  },
  {
    agent_id: '2',
    enable: true,
    agent_name: 'Plot Advisor',
    broadcast: true,
    agent_type: 'advisor',
    agent_description: 'Analyzes plot consistency and suggests improvements.',
    create_at: new Date().toISOString(),
    history_meta: {}
  },
  {
    agent_id: '3',
    enable: false,
    agent_name: 'Character Builder',
    broadcast: false,
    agent_type: 'builder',
    agent_description: 'Helps create deep and consistent characters.',
    create_at: new Date().toISOString(),
    history_meta: {}
  }
];

const mockSessions: Record<string, AgentMessage[]> = {};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mappers
const mapAgentResponseToMeta = (res: AgentResponse): AgentMeta => ({
  agent_id: res.id,
  enable: res.enabled,
  agent_name: res.name,
  broadcast: res.broadcast,
  agent_description: res.description,
  create_at: new Date().toISOString(), // Backend doesn't return create_at yet
});

const mapAgentResponseToDetail = (res: AgentResponse): AgentDetail => ({
  ...mapAgentResponseToMeta(res),
  agent_type: res.agent_type,
  history_meta: {}, // Backend doesn't return history meta yet
});

export const agentService = {
  getAgents: async (): Promise<AgentMeta[]> => {
    if (USE_MOCK) {
      await delay(500);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return mockAgents.map(({ history_meta, ...meta }) => meta);
    }
    const response = await request.get<AgentResponse[]>('/plugin/agent/manager');
    return response.map(mapAgentResponseToMeta);
  },

  getAgentDetail: async (id: string): Promise<AgentDetail> => {
    if (USE_MOCK) {
      await delay(500);
      const agent = mockAgents.find(a => a.agent_id === id);
      if (!agent) throw new Error('Agent not found');
      return { ...agent };
    }
    const response = await request.get<AgentResponse>(`/plugin/agent/manager/${id}`);
    return mapAgentResponseToDetail(response);
  },

  createAgent: async (data: AgentCreateRequest): Promise<AgentMeta> => {
    // Note: The backend documentation does not explicitly list a create agent endpoint under /plugin/agent/manager.
    // This might be handled via a different mechanism or manually.
    // Keeping this for now but it might fail.
    if (USE_MOCK) {
      await delay(500);
      const newAgent: AgentDetail = {
        agent_id: Date.now().toString(),
        enable: true,
        agent_name: data.agent_name,
        agent_type: data.agent_type || 'custom',
        agent_description: data.agent_description,
        broadcast: data.broadcast || false,
        create_at: new Date().toISOString(),
        history_meta: {}
      };
      mockAgents.push(newAgent);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { history_meta, ...meta } = newAgent;
      return meta;
    }
    // Assuming a create endpoint exists or fallback to error
    console.warn("Create Agent API not explicitly defined in doc. Trying /plugin/agent/manager");
    const response = await request.post<AgentResponse>('/plugin/agent/manager', {
      name: data.agent_name,
      agent_type: data.agent_type,
      description: data.agent_description,
      broadcast: data.broadcast,
      config: {} // Default empty config
    });
    return mapAgentResponseToMeta(response);
  },

  updateAgent: async (id: string, data: AgentUpdateRequest): Promise<void> => {
    if (USE_MOCK) {
      await delay(500);
      const index = mockAgents.findIndex(a => a.agent_id === id);
      if (index === -1) throw new Error('Agent not found');
      mockAgents[index] = { ...mockAgents[index], ...data };
      return;
    }
    await request.patch<AgentResponse>(`/plugin/agent/manager/${id}`, {
      broadcast: data.broadcast
    });
  },

  // Simulate SSE chat or use backend invoke
  chatStream: (
    agentId: string, 
    sessionId: string, 
    payload: MessagesSendRequest,
    onMessage: (chunk: string) => void,
    onFinish: () => void,
    onError: (err: unknown) => void
  ) => {
    if (USE_MOCK) {
      // Simulate thinking delay
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _agentId = agentId;
      setTimeout(() => {
        const responseText = `This is a simulated response from agent ${agentId} for input: "${payload.context}". \n\nHere is some generated content...`;
        let currentIndex = 0;
        
        const interval = setInterval(() => {
          if (currentIndex >= responseText.length) {
            clearInterval(interval);
            onFinish();
            
            // Save to mock history
            if (!mockSessions[sessionId]) mockSessions[sessionId] = [];
            mockSessions[sessionId].push({ role: 'user', content: payload.context, timestamp: new Date().toISOString() });
            mockSessions[sessionId].push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
            
            return;
          }
          
          const chunk = responseText.slice(currentIndex, currentIndex + 5); // Send 5 chars at a time
          currentIndex += 5;
          onMessage(chunk);
        }, 50);
      }, 1000);
      return () => {}; // Cleanup function
    }

    // Real backend implementation with SSE
    const controller = new AbortController();
    const url = `${config.work.apiBaseUrl}/plugin/agent/manager/${agentId}/history/${sessionId}/messages`;
    
    (async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is null');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line

          for (const line of lines) {
             if (line.startsWith('data: ')) {
                 const dataStr = line.slice(6);
                 try {
                     // Check if it is the end of stream or valid JSON
                     if (dataStr === '[DONE]') {
                         onFinish();
                         return;
                     }
                     const data = JSON.parse(dataStr);
                     // Expected data structure from doc: { message_chunk: str|dict }
                     if (data.message_chunk) {
                         const content = typeof data.message_chunk === 'string' ? data.message_chunk : JSON.stringify(data.message_chunk);
                         onMessage(content);
                     }
                 } catch (e) {
                     console.error('Failed to parse SSE data', e);
                 }
             } else if (line.startsWith('event: ')) {
                 const eventType = line.slice(7);
                 if (eventType === 'chat/end' || eventType === 'tool/chat/end') {
                     // Maybe handle end event explicitly if data doesn't come with it?
                 }
             }
          }
        }
        
        onFinish();

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            console.log('Stream aborted');
        } else {
            console.error("Agent invoke error:", err);
            onError(err);
        }
      }
    })();

    return () => controller.abort();
  },

  getSessionHistory: async (agentId: string, sessionId: string): Promise<AgentMessage[]> => {
    if (USE_MOCK) {
      await delay(300);
      return mockSessions[sessionId] || [];
    }
    // Backend doesn't have a direct "get history" endpoint yet exposed here?
    // The history is stored in the checkpointer by thread_id.
    // We might need to implement a history endpoint in backend or just rely on local state/context for now.
    // For now, return empty or implement a workaround.
    console.warn("Backend history retrieval not implemented yet");
    return [];
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createSession: async (agentId: string): Promise<string> => {
    if (USE_MOCK) {
        return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    // Create Session via POST /plugin/agent/manager/{agent_id}/history/{session_id}
    // We generate a session ID first or let backend handle it? 
    // Doc says: POST /plugin/agent/manager/{agent_id}/history/{session_id}
    // So we need to generate session_id client side? Or maybe backend expects it.
    // Let's generate one client side.
    const sessionId = crypto.randomUUID();
    await request.post(`/plugin/agent/manager/${agentId}/history/${sessionId}`, {});
    return sessionId;
  },

  /**
   * 删除 Agent
   * 注释者: FrontendAgent(react)
   * 时间: 2026-01-26 19:40:00
   * 说明: 删除指定ID的Agent。对接后端 DELETE /agents/{agent_id} 接口。
   */
  deleteAgent: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(500);
      const index = mockAgents.findIndex(a => a.agent_id === id);
      if (index !== -1) {
          mockAgents.splice(index, 1);
      }
      return;
    }
    // Backend Doc does not explicitly list DELETE for agent manager.
    console.warn("Delete Agent API not explicitly defined in doc. Trying DELETE /plugin/agent/manager/{id}");
    await request.delete(`/plugin/agent/manager/${id}`);
  }
};
