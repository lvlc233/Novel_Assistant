import { NovelOverviewDto, DirectoryNodeDto, NovelDetailDto } from '@/services/models';
import { Novel, Volume, Chapter } from '@/types/novel';
import { request } from '@/lib/request';
import { mockNovels, USE_MOCK, saveMockData } from '@/services/mockData';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260121-01
 * 创建时间: 2026-01-20 21:48
 * 更新时间: 2026-01-21 11:30
 * 更新记录:
 * - [2026-01-21 11:30:FE-REF-20260121-01: 在何处使用: 小说列表/详情页面；如何使用: getNovelList/getNovelDetail/createNovel；实现概述: 引入 mockData 并在 USE_MOCK=true 时返回模拟数据。]
 * - [2026-01-20 21:48:FE-REF-20260120-02: 在何处使用: 小说列表/详情页面；如何使用: getNovelList/getNovelDetail/createNovel；实现概述: createNovel 对齐后端返回 NovelOverviewDto 并复用映射，移除 any。]
 */

/**
 * Data Model Mapping: DTO -> Domain Model
 */
function mapDtoToModel(dto: NovelOverviewDto): Novel {
  return {
    id: dto.novel_id,
    title: dto.novel_name,
    cover: dto.novel_cover_image_url || '',
    synopsis: dto.novel_summary || '暂无简介',
    wordCount: dto.novel_word_count || 0,
    status: dto.novel_state === 'COMPLETED' ? '完结' : '连载中',
    type: dto.novel_type || '玄幻',
    updatedAt: new Date(dto.novel_update_time).toLocaleString(),
    createdAt: new Date(dto.novel_create_time).toLocaleDateString(),
    volumes: [],
    orphanChapters: []
  };
}

function mapDirectoryToVolumesAndChapters(directory: DirectoryNodeDto[]): { volumes: Volume[], orphanChapters: Chapter[] } {
  const volumes: Volume[] = [];
  const orphanChapters: Chapter[] = [];

  const sortedDir = [...directory].sort((a, b) => a.sort_order - b.sort_order);

  sortedDir.forEach(node => {
    if (node.node_type === 'folder') {
      const chapters: Chapter[] = [];
      if (node.children) {
        node.children.sort((a, b) => a.sort_order - b.sort_order).forEach(child => {
          if (child.node_type === 'document') {
            chapters.push({
              id: child.node_id,
              title: child.node_name,
              order: child.sort_order,
              volumeId: node.node_id,
              currentVersionId: 'v1',
              versions: [
                 {
                     id: 'v1',
                     versionNumber: 1,
                     content: '',
                     updatedAt: child.update_time || new Date().toISOString()
                 }
              ]
            });
          }
        });
      }
      volumes.push({
        id: node.node_id,
        title: node.node_name,
        order: node.sort_order,
        isExpanded: true,
        chapters: chapters
      });
    } else if (node.node_type === 'document') {
      orphanChapters.push({
        id: node.node_id,
        title: node.node_name,
        order: node.sort_order,
        currentVersionId: 'v1',
        versions: [
             {
                 id: 'v1',
                 versionNumber: 1,
                 content: '',
                 updatedAt: node.update_time || new Date().toISOString()
             }
        ]
      });
    }
  });

  return { volumes, orphanChapters };
}

function mapDetailDtoToModel(dto: NovelDetailDto): Novel {
  const { volumes, orphanChapters } = mapDirectoryToVolumesAndChapters(dto.directory);
  return {
    id: dto.novel_id,
    title: dto.novel_name,
    cover: dto.novel_cover_image_url || '',
    synopsis: dto.novel_summary || '暂无简介',
    wordCount: dto.novel_word_count || 0,
    status: dto.novel_state === 'COMPLETED' ? '完结' : '连载中',
    updatedAt: new Date(dto.novel_update_time).toLocaleString(),
    createdAt: new Date(dto.novel_create_time).toLocaleDateString(),
    volumes,
    orphanChapters
  };
}

/**
 * Get Novel List
 */
export async function getNovelList(userId: string): Promise<Novel[]> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockNovels;
  }
  const data = await request.post<NovelOverviewDto[]>('/get_novels', { user_id: userId });
  if (Array.isArray(data)) {
    return data.map(mapDtoToModel);
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
        // Return a shallow copy of the novel and its arrays to prevent state mutation issues
        return {
            ...novel,
            volumes: novel.volumes ? [...novel.volumes] : [],
            orphanChapters: novel.orphanChapters ? [...novel.orphanChapters] : []
        };
    }
    throw new Error('Novel not found');
  }
  const data = await request.post<NovelDetailDto>('/get_novel_detail', { user_id: userId, novel_id: novelId });
  return mapDetailDtoToModel(data);
}

export interface CreateNovelDto {
  user_id: string;
  novel_name: string;
  novel_summary?: string;
  novel_cover_image_url?: string;
  kd_id_list?: string[];
  novel_type?: string;
  novel_genre?: string;
  plugins?: { id: string; enabled: boolean; config: any }[];
}

/**
 * Create Novel
 */
export async function createNovel(data: CreateNovelDto): Promise<Novel> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newNovel: Novel = {
        id: `mock-${crypto.randomUUID()}`,
        title: data.novel_name,
        cover: data.novel_cover_image_url || '',
        synopsis: data.novel_summary || '暂无简介',
        wordCount: 0,
        status: '连载中',
        type: data.novel_type || '小说',
        genre: data.novel_genre || '玄幻',
        plugins: data.plugins || [],
        updatedAt: new Date().toLocaleString(),
        createdAt: new Date().toLocaleDateString(),
        volumes: [],
        orphanChapters: []
      };
      mockNovels.push(newNovel);
      return newNovel;
    }
    const result = await request.post<NovelOverviewDto>('/create_novel', data);
    return mapDtoToModel(result);
}

export interface UpdateNovelDto {
  novel_id: string;
  user_id: string;
  novel_name?: string;
  novel_summary?: string;
  novel_cover_image_url?: string;
  plugins?: { id: string; enabled: boolean; config: Record<string, unknown> }[];
}

/**
 * Update Novel
 */
export async function updateNovel(data: UpdateNovelDto): Promise<Novel> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novelIndex = mockNovels.findIndex(n => n.id === data.novel_id);
        if (novelIndex > -1) {
            mockNovels[novelIndex] = {
                ...mockNovels[novelIndex],
                title: data.novel_name ?? mockNovels[novelIndex].title,
                synopsis: data.novel_summary ?? mockNovels[novelIndex].synopsis,
                cover: data.novel_cover_image_url ?? mockNovels[novelIndex].cover,
                plugins: data.plugins ?? mockNovels[novelIndex].plugins,
                updatedAt: new Date().toLocaleString()
            };
            saveMockData();
            return mockNovels[novelIndex];
        }
        throw new Error('Novel not found');
    }
    const result = await request.post<NovelOverviewDto>('/update_novel', data);
    return mapDtoToModel(result);
}

/**
 * Delete Novel
 */
export async function deleteNovel(userId: string, novelId: string): Promise<void> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = mockNovels.findIndex(n => n.id === novelId);
        if (index > -1) {
            mockNovels.splice(index, 1);
        }
        return;
    }
    await request.post('/delete_novel', { user_id: userId, novel_id: novelId });
}

