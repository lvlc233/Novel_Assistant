import { request } from '@/lib/request';
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
    agent_name: 'Novel Writer',
    broadcast: false,
    agent_type: 'writer',
    agent_description: 'Specializes in writing novel chapters based on outlines.',
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
    const response = await request.get<AgentResponse[]>('/agents');
    return response.map(mapAgentResponseToMeta);
  },

  getAgentDetail: async (id: string): Promise<AgentDetail> => {
    if (USE_MOCK) {
      await delay(500);
      const agent = mockAgents.find(a => a.agent_id === id);
      if (!agent) throw new Error('Agent not found');
      return { ...agent };
    }
    const response = await request.get<AgentResponse>(`/agents/${id}`);
    return mapAgentResponseToDetail(response);
  },

  createAgent: async (data: AgentCreateRequest): Promise<AgentMeta> => {
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
    const response = await request.post<AgentResponse>('/agents', {
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
    await request.patch<AgentResponse>(`/agents/${id}`, {
      broadcast: data.broadcast
      // Note: Backend supports more fields, but frontend interface currently only exposes broadcast for update?
      // If needed, expand AgentUpdateRequest to include other fields.
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

    // Real backend implementation
    const controller = new AbortController();
    
    (async () => {
      try {
        // Construct input for LangGraph
        // Assuming the graph expects "messages" list
        const inputData = {
          messages: [
            {
              role: "user",
              content: payload.context
            }
          ]
        };

        const response = await request.post<InvokeAgentResponse>(`/agents/${agentId}/invoke`, {
          input: inputData,
          thread_id: sessionId
        });

        // Extract response from LangGraph state
        // Assuming output.messages is a list and we want the last one
        const messages = response.output.messages || [];
        const lastMessage = messages[messages.length - 1];
        const responseText = lastMessage?.content || "No response content";

        // Since backend is not streaming yet, we emit the whole text
        // We could simulate streaming here for better UI experience if needed
        onMessage(responseText);
        onFinish();

      } catch (err) {
        console.error("Agent invoke error:", err);
        onError(err);
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
    // Generate a random session ID (thread_id)
    return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
    await request.delete(`/agents/${id}`);
  }
};
