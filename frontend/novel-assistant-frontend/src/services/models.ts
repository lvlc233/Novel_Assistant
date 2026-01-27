
import { Novel } from '@/types/novel';

/**
 * Backend DTOs
 */
export interface WorkMetaDTO {
  work_id: string;
  work_cover_image_url?: string;
  work_name?: string;
  work_summary?: string;
  work_state: "完成" | "进行中";
  work_type: string;
  created_time: string;
  updated_time: string;
}

export interface NodeDTO {
  node_id: string;
  node_name: string;
  description?: string;
  node_type: "document" | "folder";
  parent_id?: string | null;
  sort_order: number;
}

export interface EdgeDTO {
  from_nodes: string[];
  to_nodes: string[];
}

export interface WorkDetailResponse {
  works_meta: WorkMetaDTO;
  works_document: NodeDTO[];
  works_documents_relationship: EdgeDTO[];
}

export interface WorkMetaResponse {
  work_meta: WorkMetaDTO;
}

export interface WorkPluginMetaResponse {
    plugin_id: string;
    name: string;
    enabled: boolean;
    description?: string;
}

export interface WorkPluginDetailResponse {
    plugin_id: string;
    name: string;
    description?: string;
    enabled: boolean;
    config: Record<string, unknown>;
    from_type: "system" | "custom";
    scope_type: "global" | "work" | "document";
    tags: string[];
}

// Re-export specific DTOs if needed by components, or create mappers.
// For now, services will consume these and return domain models.
