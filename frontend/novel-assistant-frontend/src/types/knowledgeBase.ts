export interface KnowledgeBaseChunk {
  id: string;
  kd_id: string;
  title: string;
  content: string;
  tags?: string[];
  updated_at?: string;
  created_at?: string;
}

export interface KnowledgeBaseMeta {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeBaseDetail extends KnowledgeBaseMeta {
  chunks: KnowledgeBaseChunk[];
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  tags?: string[];
}

export interface CreateKnowledgeBaseChunkRequest {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateKnowledgeBaseChunkRequest {
  title?: string;
  content?: string;
  tags?: string[];
}
