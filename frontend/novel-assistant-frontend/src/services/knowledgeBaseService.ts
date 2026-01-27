import { 
    KnowledgeBaseMeta, 
    KnowledgeBaseDetail, 
    KnowledgeBaseChunk,
    CreateKnowledgeBaseRequest,
    CreateKnowledgeBaseChunkRequest,
    UpdateKnowledgeBaseRequest,
    UpdateKnowledgeBaseChunkRequest 
} from '@/types/knowledgeBase';
import { request } from '@/lib/request';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260126-02
 * 创建时间: 2026-01-26 20:30
 * 更新时间: 2026-01-26 21:15
 * 更新记录:
 * - [2026-01-26 21:15:FE-REF-20260126-02: 确认后端接口已就绪，移除临时注释。]
 * - [2026-01-26 20:30:FE-REF-20260126-01: 移除 Mock 数据，对接真实后端接口。]
 */

// 后端接口路径为 /knowledge-bases
const BASE_URL = '/knowledge-bases';

export const knowledgeBaseService = {
    // 1. Get List
    getKnowledgeBases: async (): Promise<KnowledgeBaseMeta[]> => {
        return await request.get<KnowledgeBaseMeta[]>(BASE_URL);
    },

    // 2. Get Detail (Meta + Chunks)
    getKnowledgeBaseDetail: async (id: string): Promise<KnowledgeBaseDetail> => {
        return await request.get<KnowledgeBaseDetail>(`${BASE_URL}/${id}`);
    },

    // 3. Create KB
    createKnowledgeBase: async (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBaseMeta> => {
        return await request.post<KnowledgeBaseMeta>(BASE_URL, data);
    },

    // 4. Update KB Meta
    updateKnowledgeBase: async (id: string, data: UpdateKnowledgeBaseRequest): Promise<void> => {
        await request.patch(`${BASE_URL}/${id}`, data);
    },

    // 5. Delete KB
    deleteKnowledgeBase: async (id: string): Promise<void> => {
        await request.delete(`${BASE_URL}/${id}`);
    },

    // 6. Create Chunk
    createChunk: async (kdId: string, data: CreateKnowledgeBaseChunkRequest): Promise<KnowledgeBaseChunk> => {
        return await request.post<KnowledgeBaseChunk>(`${BASE_URL}/${kdId}/chunks`, data);
    },

    // 7. Update Chunk
    updateChunk: async (kdId: string, chunkId: string, data: UpdateKnowledgeBaseChunkRequest): Promise<void> => {
        await request.patch(`${BASE_URL}/${kdId}/chunks/${chunkId}`, data);
    },

    // 8. Delete Chunk
    deleteChunk: async (kdId: string, chunkId: string): Promise<void> => {
        await request.delete(`${BASE_URL}/${kdId}/chunks/${chunkId}`);
    }
};
