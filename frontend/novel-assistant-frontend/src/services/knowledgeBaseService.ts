import { 
    KnowledgeBaseMeta, 
    KnowledgeBaseChunk,
    CreateKnowledgeBaseRequest,
    CreateKnowledgeBaseChunkRequest,
    UpdateKnowledgeBaseRequest,
    UpdateKnowledgeBaseChunkRequest 
} from '@/types/knowledgeBase';
import { request } from '@/lib/request';
import { PluginInstance } from '@/types/plugin';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260130-03
 * 创建时间: 2026-01-26 20:30
 * 更新时间: 2026-01-30 23:30
 * 更新记录:
 * - [2026-01-30 23:30:FE-REF-20260130-03: 修复后端路由冲突，改回使用 '/plugin/kd' 固定路径。]
 * - [2026-01-30 23:20:FE-REF-20260130-02: 动态获取知识库插件ID，替换硬编码的 'kd'。]
 * - [2026-01-30 11:30:FE-REF-20260130-01: 更新接口定义以匹配最新后端API文档(Title/Context/SearchKeys)。]
 * - [2026-01-26 21:15:FE-REF-20260126-02: 确认后端接口已就绪，移除临时注释。]
 * - [2026-01-26 20:30:FE-REF-20260126-01: 移除 Mock 数据，对接真实后端接口。]
 */

export const knowledgeBaseService = {
    // 1. Get List
    getKnowledgeBases: async (): Promise<KnowledgeBaseMeta[]> => {
        return await request.get<KnowledgeBaseMeta[]>('/plugin/kd');
    },

    // 2. Get Detail (Chunks List)
    // 注意：后端返回的是 List[KDDescriptionResponse]，即 KnowledgeBaseChunk[]
    getKnowledgeBaseChunks: async (id: string): Promise<KnowledgeBaseChunk[]> => {
        return await request.get<KnowledgeBaseChunk[]>(`/plugin/kd/${id}`);
    },

    // 3. Create KB
    createKnowledgeBase: async (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBaseMeta> => {
        return await request.post<KnowledgeBaseMeta>('/plugin/kd', data);
    },

    // 4. Update KB Meta
    updateKnowledgeBase: async (id: string, data: UpdateKnowledgeBaseRequest): Promise<void> => {
        await request.patch(`/plugin/kd/${id}`, data);
    },

    // 5. Delete KB
    deleteKnowledgeBase: async (id: string): Promise<void> => {
        await request.delete(`/plugin/kd/${id}`);
    },

    // 6. Create Chunk
    createChunk: async (kdId: string, data: CreateKnowledgeBaseChunkRequest): Promise<KnowledgeBaseChunk> => {
        // Backend API: POST /plugin/kd/{kdId}
        return await request.post<KnowledgeBaseChunk>(`/plugin/kd/${kdId}`, data);
    },

    // 7. Update Chunk
    updateChunk: async (kdId: string, chunkId: string, data: UpdateKnowledgeBaseChunkRequest): Promise<void> => {
        // Backend API: PATCH /plugin/kd/{kdId}/{chunkId}
        await request.patch(`/plugin/kd/${kdId}/${chunkId}`, data);
    },

    // 8. Delete Chunk
    deleteChunk: async (kdId: string, chunkId: string): Promise<void> => {
        // Backend API: DELETE /plugin/kd/{kdId}/{chunkId}
        await request.delete(`/plugin/kd/${kdId}/${chunkId}`);
    }
};
