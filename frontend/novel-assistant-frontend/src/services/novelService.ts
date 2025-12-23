import { Novel } from '@/types/novel';
import { config } from '@/config';

const API_BASE_URL = config.novel.apiBaseUrl;

export interface NovelOverviewDto {
  novel_id: string;
  novel_name: string;
  novel_cover_image_url: string;
  novel_summary: string;
  novel_state: string;
  novel_word_count: number;
  novel_create_time: string;
  novel_update_time: string;
  novel_hiatus_interval: number;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

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

/**
 * 获取小说列表
 * @param userId 用户ID
 * @returns Novel[]
 */
/**
 * 获取小说列表
 * @param userId 用户ID
 * @returns Novel[]
 */
export async function getNovelList(userId: string): Promise<Novel[]> {
  try {
    console.log(`[getNovelList] Requesting: ${API_BASE_URL}/get_novels with user_id: ${userId}`);
    const response = await fetch(`${API_BASE_URL}/get_novels`, {
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

    if (data.code === "200" && Array.isArray(data.data)) {
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
    console.log(`[createNovel] Requesting: ${API_BASE_URL}/create_novel`, data);
    const response = await fetch(`${API_BASE_URL}/create_novel`, {
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
