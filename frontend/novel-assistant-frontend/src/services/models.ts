
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

export interface DirectoryNodeDto {
  node_id: string;
  node_name: string;
  node_type: 'folder' | 'document';
  sort_order: number;
  children: DirectoryNodeDto[];
  word_count?: number;
  update_time?: string;
  create_time?: string;
}

export interface NovelDetailDto {
  novel_id: string;
  novel_name: string;
  novel_cover_image_url?: string;
  novel_summary?: string;
  novel_state: string;
  novel_create_time: string;
  novel_update_time: string;
  novel_hiatus_interval: number;
  novel_word_count: number;
  directory: DirectoryNodeDto[];
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}
