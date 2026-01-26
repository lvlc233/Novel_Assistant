import { 
  MemoryMeta, 
  MemoryDetail, 
  MemoryCreateRequest, 
  MemoryUpdateRequest
} from '@/types/memory';

// Mock data
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

export const memoryService = {
  getMemories: async (): Promise<MemoryMeta[]> => {
    await delay(500);
    // Return copy to avoid reference issues
    return mockMemories.map(({ memory_id, enable, memory_name, memory_description, create_at }) => ({
      memory_id,
      enable,
      memory_name,
      memory_description,
      create_at
    }));
  },

  getMemoryDetail: async (id: string): Promise<MemoryDetail> => {
    await delay(500);
    const memory = mockMemories.find(m => m.memory_id === id);
    if (!memory) throw new Error('Memory not found');
    return { ...memory };
  },

  createMemory: async (data: MemoryCreateRequest): Promise<MemoryMeta> => {
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
    mockMemories = [newMemory, ...mockMemories];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { memory_content, memory_type, ...meta } = newMemory;
    return meta;
  },

  updateMemory: async (id: string, data: MemoryUpdateRequest): Promise<void> => {
    await delay(500);
    const index = mockMemories.findIndex(m => m.memory_id === id);
    if (index === -1) throw new Error('Memory not found');
    
    mockMemories[index] = {
      ...mockMemories[index],
      ...data,
      // Map memory_context to memory_content if provided
      memory_content: data.memory_context !== undefined ? data.memory_context : mockMemories[index].memory_content
    };
  },

  deleteMemory: async (id: string): Promise<void> => {
    await delay(500);
    mockMemories = mockMemories.filter(m => m.memory_id !== id);
  }
};
