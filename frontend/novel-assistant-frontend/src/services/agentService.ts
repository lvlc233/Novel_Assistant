import { 
  AgentMeta, 
  AgentDetail, 
  AgentUpdateRequest, 
  MessagesSendRequest,
  AgentMessage
} from '@/types/agent';

// Mock data
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

export const agentService = {
  getAgents: async (): Promise<AgentMeta[]> => {
    await delay(500);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return mockAgents.map(({ history_meta, ...meta }) => meta);
  },

  getAgentDetail: async (id: string): Promise<AgentDetail> => {
    await delay(500);
    const agent = mockAgents.find(a => a.agent_id === id);
    if (!agent) throw new Error('Agent not found');
    return { ...agent };
  },

  createAgent: async (data: AgentCreateRequest): Promise<AgentMeta> => {
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
  },

  updateAgent: async (id: string, data: AgentUpdateRequest): Promise<void> => {
    await delay(500);
    const index = mockAgents.findIndex(a => a.agent_id === id);
    if (index === -1) throw new Error('Agent not found');
    mockAgents[index] = { ...mockAgents[index], ...data };
  },

  // Simulate SSE chat
  // In real implementation, this would return an EventSource or a ReadableStream
  // For mock, we'll return a callback-based interface
  chatStream: (
    agentId: string, 
    sessionId: string, 
    payload: MessagesSendRequest,
    onMessage: (chunk: string) => void,
    onFinish: () => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError: (err: unknown) => void
  ) => {
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
  },

  getSessionHistory: async (agentId: string, sessionId: string): Promise<AgentMessage[]> => {
    await delay(300);
    return mockSessions[sessionId] || [];
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createSession: async (agentId: string): Promise<string> => {
    await delay(300);
    return `session-${Date.now()}`;
  },

  deleteAgent: async (id: string): Promise<void> => {
    await delay(500);
    const index = mockAgents.findIndex(a => a.agent_id === id);
    if (index !== -1) {
        mockAgents.splice(index, 1);
    }
  }
};
