import { 
    KnowledgeBaseMeta, 
    KnowledgeBaseDetail, 
    KnowledgeBaseChunk,
    CreateKnowledgeBaseRequest,
    CreateKnowledgeBaseChunkRequest,
    UpdateKnowledgeBaseRequest,
    UpdateKnowledgeBaseChunkRequest 
} from '@/types/knowledgeBase';

// Mock Data
let mockKBs: KnowledgeBaseMeta[] = [
    {
        id: 'kb-1',
        name: '世界观设定集',
        description: '关于魔法世界的基本规则、地理、种族等设定',
        tags: ['设定', '世界观'],
        updated_at: '2026-01-20T10:00:00Z'
    },
    {
        id: 'kb-2',
        name: '人物小传',
        description: '主要角色和配角的背景故事、性格特征',
        tags: ['角色', '传记'],
        updated_at: '2026-01-21T14:30:00Z'
    }
];

const mockChunks: Record<string, KnowledgeBaseChunk[]> = {
    'kb-1': [
        { id: 'c-1', kd_id: 'kb-1', title: '魔法体系', content: '魔法分为元素魔法和精神魔法...', tags: ['魔法'] },
        { id: 'c-2', kd_id: 'kb-1', title: '地理分布', content: '大陆分为东西两块...', tags: ['地理'] }
    ],
    'kb-2': [
        { id: 'c-3', kd_id: 'kb-2', title: '主角: 艾伦', content: '艾伦出生于...', tags: ['主角'] }
    ]
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const knowledgeBaseService = {
    // 1. Get List
    getKnowledgeBases: async (): Promise<KnowledgeBaseMeta[]> => {
        await delay(500);
        return [...mockKBs];
    },

    // 2. Get Detail (Meta + Chunks)
    getKnowledgeBaseDetail: async (id: string): Promise<KnowledgeBaseDetail> => {
        await delay(500);
        const meta = mockKBs.find(k => k.id === id);
        if (!meta) throw new Error('Knowledge Base not found');
        const chunks = mockChunks[id] || [];
        return { ...meta, chunks };
    },

    // 3. Create KB
    createKnowledgeBase: async (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBaseMeta> => {
        await delay(500);
        const newKB: KnowledgeBaseMeta = {
            id: `kb-${Date.now()}`,
            name: data.name,
            description: data.description,
            tags: data.tags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        mockKBs = [newKB, ...mockKBs];
        mockChunks[newKB.id] = [];
        return newKB;
    },

    // 4. Update KB Meta
    updateKnowledgeBase: async (id: string, data: UpdateKnowledgeBaseRequest): Promise<void> => {
        await delay(300);
        mockKBs = mockKBs.map(kb => 
            kb.id === id 
                ? { ...kb, ...data, updated_at: new Date().toISOString() }
                : kb
        );
    },

    // 5. Delete KB
    deleteKnowledgeBase: async (id: string): Promise<void> => {
        await delay(500);
        mockKBs = mockKBs.filter(kb => kb.id !== id);
        delete mockChunks[id];
    },

    // 6. Create Chunk
    createChunk: async (kdId: string, data: CreateKnowledgeBaseChunkRequest): Promise<KnowledgeBaseChunk> => {
        await delay(300);
        const newChunk: KnowledgeBaseChunk = {
            id: `chunk-${Date.now()}`,
            kd_id: kdId,
            title: data.title,
            content: data.content,
            tags: data.tags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        if (!mockChunks[kdId]) mockChunks[kdId] = [];
        mockChunks[kdId] = [newChunk, ...mockChunks[kdId]];
        return newChunk;
    },

    // 7. Update Chunk
    updateChunk: async (kdId: string, chunkId: string, data: UpdateKnowledgeBaseChunkRequest): Promise<void> => {
        await delay(300);
        if (mockChunks[kdId]) {
            mockChunks[kdId] = mockChunks[kdId].map(c => 
                c.id === chunkId
                    ? { ...c, ...data, updated_at: new Date().toISOString() }
                    : c
            );
        }
    },

    // 8. Delete Chunk
    deleteChunk: async (kdId: string, chunkId: string): Promise<void> => {
        await delay(300);
        if (mockChunks[kdId]) {
            mockChunks[kdId] = mockChunks[kdId].filter(c => c.id !== chunkId);
        }
    }
};
