// 导入数据模型
import { NovelOverviewDto, DirectoryNodeDto, NovelDetailDto ,ApiResponse} from '@/services/models';

import { Novel, Volume, Chapter, ChapterVersion } from '@/types/novel';
import { config } from '@/config';

const NOVEL_API_BASE_URL = config.novel.novelApiBaseUrl;



/**
 * 数据模型映射：DTO -> Domain Model
 */
function mapDtoToModel(dto: NovelOverviewDto): Novel {
  return {
    id: dto.novel_id,
    title: dto.novel_name,
    cover: dto.novel_cover_image_url || '',
    synopsis: dto.novel_summary || '暂无简介',
    wordCount: dto.novel_word_count || 0,
    status: dto.novel_state === 'COMPLETED' ? '完结' : '连载中', // TODO: 完善状态映射
    updatedAt: new Date(dto.novel_update_time).toLocaleString(),
    createdAt: new Date(dto.novel_create_time).toLocaleDateString(),
    // 默认值
    volumes: [],
    orphanChapters: []
  };
}

function mapDirectoryToVolumesAndChapters(directory: DirectoryNodeDto[]): { volumes: Volume[], orphanChapters: Chapter[] } {
  const volumes: Volume[] = [];
  const orphanChapters: Chapter[] = [];

  // Sort by order
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
              currentVersionId: 'v1', // Placeholder
              versions: [
                 // Placeholder version if needed, or empty
                 {
                     id: 'v1',
                     versionNumber: 1,
                     content: '', // No content in detail API
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
 * 获取小说列表
 * @param userId 用户ID
 * @returns Novel[]
 */
export async function getNovelList(userId: string): Promise<Novel[]> {
  try {
    console.log(`[getNovelList] Requesting: ${NOVEL_API_BASE_URL}/get_novels with user_id: ${userId}`);
    const response = await fetch(`${NOVEL_API_BASE_URL}/get_novels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getNovelList] API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data: ApiResponse<NovelOverviewDto[]> = await response.json();

    if (data.code === `200` && Array.isArray(data.data)) {
      return data.data.map(mapDtoToModel);
    } else {
      console.error('[getNovelList] Business Error:', data);
      throw new Error(data.message || '获取小说列表失败');
    }
  } catch (error) {
    console.error('[getNovelList] Network/Parse Error:', error);
    throw error;
  }
}

/**
 * 获取小说详情
 * @param userId 用户ID
 * @param novelId 小说ID
 * @returns Novel
 */
export async function getNovelDetail(userId: string, novelId: string): Promise<Novel> {
  try {
    console.log(`[getNovelDetail] Requesting: ${NOVEL_API_BASE_URL}/get_novel_detail`, { userId, novelId });
    const response = await fetch(`${NOVEL_API_BASE_URL}/get_novel_detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, novel_id: novelId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getNovelDetail] API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data: ApiResponse<NovelDetailDto> = await response.json();

    if (data.code === `200` && data.data) {
      return mapDetailDtoToModel(data.data);
    } else {
      console.error('[getNovelDetail] Business Error:', data);
      throw new Error(data.message || '获取小说详情失败');
    }
  } catch (error) {
    console.error('[getNovelDetail] Network/Parse Error:', error);
    throw error;
  }
}

export interface CreateNovelDto {
  user_id: string;
  novel_name: string;
  novel_summary?: string;
  novel_cover_image_url?: string;
  kd_id_list?: string[];
}

/**
 * 创建小说
 * @param data 创建小说请求参数
 * @returns Created Novel
 */
export async function createNovel(data: CreateNovelDto): Promise<Novel> {
  try {
    console.log(`[createNovel] Requesting: ${NOVEL_API_BASE_URL}/create_novel`, data);
    const response = await fetch(`${NOVEL_API_BASE_URL}/create_novel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[createNovel] API Error (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const responseData: ApiResponse<NovelOverviewDto> = await response.json();

    if (responseData.code === "200" && responseData.data) {
      return mapDtoToModel(responseData.data);
    } else {
      console.error('[createNovel] Business Error:', responseData);
      throw new Error(responseData.message || '创建小说失败');
    }
  } catch (error) {
    console.error('[createNovel] Network/Parse Error:', error);
    throw error;
  }
}
