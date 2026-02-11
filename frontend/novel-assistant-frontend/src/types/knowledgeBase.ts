/**
 * 知识库 (Knowledge Base) 领域模型定义
 * 
 * 该文件定义了与知识库管理相关的前端业务模型。
 * 知识库用于存储项目相关的背景资料、设定集等非结构化文本数据，供 Agent 检索使用。
 * 包含知识库元数据、分块详情以及创建/更新请求结构。
 */

/**
 * 知识库分块 (Chunk)
 * 知识库被切分后的最小检索单元
 */
export interface KnowledgeBaseChunk {
  /** 分块唯一标识符 */
  chunk_id: string;
  /** 分块内容文本 */
  context: string;
  /** 搜索关键词列表 (用于增强检索) */
  search_keys?: string[];
  /** 是否启用该分块 */
  enabled?: boolean;
  /** 创建时间 */
  create_at?: string;
  /** 更新时间 */
  update_at?: string;
}

/**
 * 知识库元数据
 * 用于列表展示知识库概览
 */
export interface KnowledgeBaseMeta {
  /** 知识库 ID */
  id: string;
  /** 知识库名称 (原 title) */
  title: string;
  /** 知识库描述 */
  description?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 创建时间 */
  create_at?: string;
}

/**
 * 创建知识库请求载荷
 * 对应后端 /plugin/kd 接口
 */
export interface CreateKnowledgeBaseRequest {
  /** 知识库名称 (注意：后端字段为 name，前端展示可能用 title) */
  name: string;
  /** 关联的作品 ID */
  work_id?: string;
  /** 描述信息 */
  description?: string;
}

/**
 * 创建知识库分块请求载荷
 * 用于向特定知识库添加新的内容块
 */
export interface CreateKnowledgeBaseChunkRequest {
  /** 
   * 分块 ID 
   * (注意：后端要求在 Body 中提供 chunk_id，前端需生成 UUID 或由后端生成后回填)
   */
  chunk_id: string;
  /** 内容文本 */
  context: string;
  /** 搜索关键词列表 */
  search_keys?: string[];
}

/**
 * 更新知识库请求载荷
 * 用于修改知识库的基本信息
 */
export interface UpdateKnowledgeBaseRequest {
  /** 新的名称 */
  name?: string;
  /** 新的描述 */
  description?: string;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 更新知识库分块请求载荷
 * 用于修改特定内容块的信息
 */
export interface UpdateKnowledgeBaseChunkRequest {
  /** 新的内容文本 */
  context?: string;
  /** 新的搜索关键词 */
  search_keys?: string[];
  /** 是否启用 */
  enabled?: boolean;
}
