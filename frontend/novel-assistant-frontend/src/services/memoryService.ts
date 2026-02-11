import { request } from '@/lib/request';
import { 
  MemoryMeta, 
  MemoryDetail, 
  MemoryCreateRequest, 
  MemoryUpdateRequest
} from '@/types/memory';

// Feature flag for using mock data - Disabled to use real backend
const USE_MOCK = false;

// Mock data (kept for fallback)
let mockMemories: MemoryDetail[] = [
  {
    memory_id: '1',
    enable: true,
    memory_name: 'Initial Project Context',
    memory_type: 'long',
    memory_description: 'Core project requirements and setup.',
    memory_content: 'The project is a novel assistant agent...',
    create_at: new Date().toISOString()
  },
  {
    memory_id: '2',
    enable: true,
    memory_name: 'Recent User Preference',
    memory_type: 'short',
    memory_description: 'User prefers dark mode.',
    memory_content: 'User switched to dark mode at ...',
    create_at: new Date().toISOString()
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Backend API response types
interface BackendMemoryMeta {
  memory_id: string;
  enable: boolean;
  memory_name: string;
  memory_description?: string;
  create_at: string;
}

interface BackendMemoryDetail extends BackendMemoryMeta {
  memory_type: string;
  memory_content?: string;
}

export const memoryService = {
  getMemories: async (): Promise<MemoryMeta[]> => {
    if (USE_MOCK) {
      await delay(500);
      return mockMemories.map(({ memory_id, enable, memory_name, memory_description, create_at }) => ({
        memory_id,
        enable,
        memory_name,
        memory_description,
        create_at
      }));
    }
    
    const response = await request.get<BackendMemoryMeta[]>('/plugin/memory');
    return response.map(m => ({
      memory_id: m.memory_id,
      enable: m.enable,
      memory_name: m.memory_name,
      memory_description: m.memory_description,
      create_at: m.create_at
    }));
  },

  getMemoryDetail: async (id: string): Promise<MemoryDetail> => {
    if (USE_MOCK) {
      await delay(500);
      const memory = mockMemories.find(m => m.memory_id === id);
      if (!memory) throw new Error('Memory not found');
      return { ...memory };
    }
    
    const response = await request.get<BackendMemoryDetail>(`/plugin/memory/${id}`);
    return {
      memory_id: response.memory_id,
      enable: response.enable,
      memory_name: response.memory_name,
      memory_type: response.memory_type,
      memory_description: response.memory_description,
      memory_content: response.memory_content,
      create_at: response.create_at
    };
  },

  createMemory: async (data: MemoryCreateRequest): Promise<MemoryMeta> => {
    if (USE_MOCK) {
      await delay(500);
      const newMemory: MemoryDetail = {
        memory_id: Date.now().toString(),
        enable: true,
        memory_name: data.memory_name,
        memory_type: data.memory_type,
        memory_description: data.memory_description,
        memory_content: data.memory_context,
        create_at: new Date().toISOString()
      };
      mockMemories.push(newMemory);
      const { memory_content, memory_type, ...meta } = newMemory;
      return meta;
    }
    
    const response = await request.post<BackendMemoryMeta>('/plugin/memory', data);
    return {
      memory_id: response.memory_id,
      enable: response.enable,
      memory_name: response.memory_name,
      memory_description: response.memory_description,
      create_at: response.create_at
    };
  },

  updateMemory: async (id: string, data: MemoryUpdateRequest): Promise<void> => {
    if (USE_MOCK) {
      await delay(500);
      const index = mockMemories.findIndex(m => m.memory_id === id);
      if (index === -1) throw new Error('Memory not found');
      mockMemories[index] = { ...mockMemories[index], ...data, memory_content: data.memory_context || mockMemories[index].memory_content };
      return;
    }
    
    await request.patch(`/plugin/memory/${id}`, data);
  },

  deleteMemory: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(500);
      const index = mockMemories.findIndex(m => m.memory_id === id);
      if (index > -1) mockMemories.splice(index, 1);
      return;
    }
    
    await request.delete(`/plugin/memory/${id}`);
  }
};
