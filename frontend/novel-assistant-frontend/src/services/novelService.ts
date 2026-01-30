import { WorkDetailResponse, WorkMetaResponse, WorkMetaDTO, NodeDTO } from '@/services/models';
import { Novel, Volume, Chapter } from '@/types/novel';
import { request } from '@/lib/request';
import { mockNovels, USE_MOCK, saveMockData } from '@/services/mockData';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260126-01
 * 创建时间: 2026-01-20 21:48
 * 更新时间: 2026-01-26 19:30
 * 更新记录:
 * - [2026-01-26 19:30:FE-REF-20260126-01: Refactor to match backend API /works; use flat NodeDTO list to rebuild tree.]
 */

/**
 * Data Model Mapping: DTO -> Domain Model
 */
function mapWorkMetaToNovel(meta: WorkMetaDTO): Novel {
  return {
    id: meta.work_id,
    title: meta.work_name || '未命名作品',
    cover: meta.work_cover_image_url || '',
    synopsis: meta.work_summary || '暂无简介',
    wordCount: 0, // Backend work meta doesn't have word count, need to sum from nodes or update backend
    status: meta.work_state === '完成' ? '完结' : '连载中',
    type: meta.work_type,
    updatedAt: new Date(meta.updated_time).toLocaleString(),
    createdAt: new Date(meta.created_time).toLocaleDateString(),
    volumes: [],
    orphanChapters: []
  };
}

function mapNodesToVolumesAndChapters(nodes: NodeDTO[]): { volumes: Volume[], orphanChapters: Chapter[] } {
  const volumes: Volume[] = [];
  const orphanChapters: Chapter[] = [];
  
  // 1. Separate folders (volumes) and documents (chapters)
  const folderMap = new Map<string, NodeDTO>();
  const documents: NodeDTO[] = [];
  
  nodes.forEach(node => {
    if (node.node_type === 'folder') {
      folderMap.set(node.node_id, node);
    } else {
      documents.push(node);
    }
  });

  // 2. Build Volumes
  // Assuming folders are volumes. Nested folders are not supported by Volume type yet, so we treat all folders as volumes.
  // We sort folders by sort_order
  const sortedFolders = Array.from(folderMap.values()).sort((a, b) => a.sort_order - b.sort_order);
  
  const volumeIdToVolumeMap = new Map<string, Volume>();

  sortedFolders.forEach(folder => {
      const vol: Volume = {
          id: folder.node_id,
          title: folder.node_name,
          order: folder.sort_order,
          isExpanded: true,
          chapters: []
      };
      volumes.push(vol);
      volumeIdToVolumeMap.set(folder.node_id, vol);
  });

  // 3. Assign Chapters to Volumes or Orphan
  documents.sort((a, b) => a.sort_order - b.sort_order).forEach(doc => {
      const parentId = doc.parent_id || doc.fater_node_id;
      const chapter: Chapter = {
          id: doc.node_id,
          title: doc.node_name,
          order: doc.sort_order,
          volumeId: parentId || undefined,
          currentVersionId: 'v1', // TODO: Fetch version info
          versions: [
             {
                 id: 'v1',
                 versionNumber: 1,
                 content: '', // Content is not loaded in list/detail view usually
                 updatedAt: new Date().toISOString() // TODO: Fetch real update time
             }
          ]
      };

      if (parentId && volumeIdToVolumeMap.has(parentId)) {
          volumeIdToVolumeMap.get(parentId)!.chapters.push(chapter);
      } else {
          orphanChapters.push(chapter);
      }
  });

  return { volumes, orphanChapters };
}

function mapDetailResponseToModel(data: WorkDetailResponse): Novel {
  const novel = mapWorkMetaToNovel(data.works_meta);
  const { volumes, orphanChapters } = mapNodesToVolumesAndChapters(data.works_document);
  novel.volumes = volumes;
  novel.orphanChapters = orphanChapters;
  
  // Calculate word count
  let totalWords = 0;
  // TODO: NodeDTO doesn't have word_count, but NodeDetailResponse does. 
  // We might need to fetch word count separately or ask backend to include it.
  // For now, 0.
  novel.wordCount = totalWords; 

  return novel;
}

/**
 * Get Novel List
 */
export async function getNovelList(userId: string): Promise<Novel[]> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockNovels;
  }
  // Backend doesn't use userId in body, assumes auth token or session
  const response = await request.get<WorkMetaResponse[]>('/works');
  if (Array.isArray(response)) {
    return response.map(item => mapWorkMetaToNovel(item.work_meta));
  }
  return [];
}

/**
 * Get Novel Detail
 */
export async function getNovelDetail(userId: string, novelId: string): Promise<Novel> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const novel = mockNovels.find(n => n.id === novelId);
    if (novel) {
        return {
            ...novel,
            volumes: novel.volumes ? [...novel.volumes] : [],
            orphanChapters: novel.orphanChapters ? [...novel.orphanChapters] : []
        };
    }
    throw new Error('Novel not found');
  }
  const data = await request.get<WorkDetailResponse>(`/works/${novelId}`);
  return mapDetailResponseToModel(data);
}

export interface CreateNovelDto {
  user_id: string; // Ignored by backend
  novel_name: string;
  novel_summary?: string;
  novel_cover_image_url?: string | File;
  novel_type?: string;
  novel_genre?: string;
  kd_id_list?: string[];
  plugins?: { id: string; enabled: boolean; config: any }[];
}

/**
 * Create Novel
 */
export async function createNovel(data: CreateNovelDto): Promise<Novel> {
    if (USE_MOCK) {
      // ... mock implementation ...
      await new Promise(resolve => setTimeout(resolve, 500));
      const newNovel: Novel = {
        id: `mock-${crypto.randomUUID()}`,
        title: data.novel_name,
        cover: typeof data.novel_cover_image_url === 'string' ? data.novel_cover_image_url : '',
        synopsis: data.novel_summary || '暂无简介',
        wordCount: 0,
        status: '连载中',
        type: data.novel_type || 'novel',
        updatedAt: new Date().toLocaleString(),
        createdAt: new Date().toLocaleDateString(),
        volumes: [],
        orphanChapters: []
      };
      mockNovels.push(newNovel);
      return newNovel;
    }
    
    let coverUrl = typeof data.novel_cover_image_url === 'string' ? data.novel_cover_image_url : undefined;
    
    // Handle File Upload
    if (data.novel_cover_image_url instanceof File) {
        const formData = new FormData();
        formData.append('file', data.novel_cover_image_url);
        
        try {
            const uploadRes = await request<{url: string, filename: string}>('/files/upload', {
                method: 'POST',
                body: formData
            });
            coverUrl = uploadRes.url;
        } catch (error) {
            console.error("Upload failed", error);
            // Optionally throw or continue without cover
        }
    }

    const payload = {
        works_name: data.novel_name,
        works_summary: data.novel_summary,
        works_cover_image_url: coverUrl,
        works_type: data.novel_type || 'novel',
        kd_id_list: data.kd_id_list || [],
        enabled_plugin_id_list: data.plugins?.filter(p => p.enabled).map(p => p.id) || []
    };
    
    const result = await request.post<WorkMetaResponse>('/works', payload);
    return mapWorkMetaToNovel(result.work_meta);
}

export interface UpdateNovelDto {
  novel_id: string;
  user_id: string; // Ignored
  novel_name?: string;
  novel_summary?: string;
  novel_cover_image_url?: string | File;
  plugins?: { id: string; enabled: boolean; config: any }[];
  // plugins update is separate API in backend
}

/**
 * Update Novel
 */
export async function updateNovel(data: UpdateNovelDto): Promise<Novel> {
    if (USE_MOCK) {
        // ... mock ...
        await new Promise(resolve => setTimeout(resolve, 500));
        const novelIndex = mockNovels.findIndex(n => n.id === data.novel_id);
        if (novelIndex > -1) {
            mockNovels[novelIndex] = {
                ...mockNovels[novelIndex],
                title: data.novel_name ?? mockNovels[novelIndex].title,
                synopsis: data.novel_summary ?? mockNovels[novelIndex].synopsis,
                cover: (typeof data.novel_cover_image_url === 'string' ? data.novel_cover_image_url : mockNovels[novelIndex].cover) || '',
                updatedAt: new Date().toLocaleString()
            };
            saveMockData();
            return mockNovels[novelIndex];
        }
        throw new Error('Novel not found');
    }
    
    let coverUrl = typeof data.novel_cover_image_url === 'string' ? data.novel_cover_image_url : undefined;

    // Handle File Upload
    if (data.novel_cover_image_url instanceof File) {
        const formData = new FormData();
        formData.append('file', data.novel_cover_image_url);
        
        try {
            const uploadRes = await request<{url: string, filename: string}>('/files/upload', {
                method: 'POST',
                body: formData
            });
            coverUrl = uploadRes.url;
        } catch (error) {
            console.error("Upload failed", error);
        }
    }

    const payload = {
        works_name: data.novel_name,
        works_summary: data.novel_summary,
        works_cover_image_url: coverUrl
    };
    
    await request.patch(`/works/${data.novel_id}`, payload);
    // Fetch updated detail or return partial? 
    // Backend patch returns None. We should fetch detail again or just return what we have?
    // Let's fetch detail to be safe and consistent
    return getNovelDetail(data.user_id, data.novel_id);
}

/**
 * Delete Novel
 * 注释者: FrontendAgent(react)
 * 时间: 2026-01-26 19:40:00
 * 说明: 删除指定ID的作品。对接后端 DELETE /works/{work_id} 接口。
 */
export async function deleteNovel(userId: string, novelId: string): Promise<void> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = mockNovels.findIndex(n => n.id === novelId);
        if (index > -1) {
            mockNovels.splice(index, 1);
            saveMockData();
        }
        return;
    }
    
    await request.delete(`/works/${novelId}`);
}
