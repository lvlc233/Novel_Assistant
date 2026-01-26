// 61xxx Memory Plugin Types

export type MemoryType = 'long' | 'short';

export interface MemoryMeta {
  memory_id: string; // UUID
  enable: boolean;
  memory_name: string;
  memory_description?: string;
  create_at: string; // datetime string
}

export interface MemoryDetail extends MemoryMeta {
  memory_type: MemoryType;
  memory_content?: string;
}

export interface MemoryCreateRequest {
  memory_name: string;
  memory_type: MemoryType;
  memory_description?: string;
  memory_context?: string; // Content
}

export interface MemoryUpdateRequest {
  enable?: boolean;
  memory_name?: string;
  memory_description?: string;
  memory_context?: string; // Content
}
