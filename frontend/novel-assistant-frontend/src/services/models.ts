
import { Novel } from '@/types/work';

/**
 * 后端数据传输对象 (DTO) 定义
 * 
 * 该文件严格对应后端 API 接口返回的 JSON 数据结构。
 * 所有字段命名应与后端保持一致（通常为下划线命名），不做驼峰转换。
 * 用于 API 请求参数和响应结果的类型约束。
 */

/**
 * 作品元数据 DTO
 * 对应后端 WorkMeta 实体
 */
export interface WorkMetaDTO {
  /** 作品唯一标识符 */
  id: string;
  /** 封面图片 URL */
  cover_image_url?: string | null;
  /** 作品名称 */
  name?: string | null;
  /** 作品摘要/简介 */
  summary?: string | null;
  /** 作品状态枚举 */
  state: "完成" | "进行中";
  /** 作品类型 (如: Novel) */
  type: string;
  /** 创建时间 */
  create_at: string;
  /** 更新时间 */
  update_at: string;
}

/**
 * 节点 DTO (目录树节点)
 * 对应后端 Node 实体，用于表示文件夹或文档
 */
export interface NodeDTO {
  /** 节点唯一标识符 */
  id: string;
  /** 节点名称 */
  name: string;
  /** 节点描述 */
  description?: string | null;
  /** 节点类型: document(文档/章节), folder(文件夹/卷) */
  type: "document" | "folder";
  /** 父节点 ID (用于构建树状结构) */
  from_node_id?: string | null;
  /** 当前版本号 */
  now_version?: string | null;
  /** 当前版本 ID */
  current_version_id?: string | null;
}

/**
 * 关系边 DTO
 * 描述节点之间的连接关系 (主要用于图谱或复杂关联)
 */
export interface EdgeDTO {
  /** 起始节点 ID */
  from_node_id: string;
  /** 目标节点 ID 列表 */
  to_node_ids: string[];
}

/**
 * 作品详情响应
 * GET /work/{id} 的响应结构
 */
export interface WorkDetailResponse {
  /** 作品元数据 */
  meta: WorkMetaDTO;
  /** 包含的所有节点列表 (扁平化) */
  document: NodeDTO[];
  /** 节点间的关系列表 */
  relationship: EdgeDTO[];
}

/**
 * 作品元数据响应
 * 仅包含元数据的响应结构
 */
export interface WorkMetaResponse {
  /** 作品元数据 */
  meta: WorkMetaDTO;
}

/**
 * 创建文档请求载荷
 * POST /document
 */
export interface DocumentCreateRequest {
  /** 文档标题 */
  title: string;
  /** 文档描述 */
  description?: string | null;
  /** 父节点 ID (所属文件夹/卷) */
  from_node_id?: string | null;
}

/**
 * 文档响应 DTO
 * 创建或更新文档后的返回结果
 */
export interface DocumentResponse {
  /** 文档 ID */
  id: string;
  /** 文档标题 */
  title: string;
  /** 文档描述 */
  description?: string | null;
  /** 父节点 ID */
  from_node_id?: string | null;
  /** 当前版本号 */
  now_version?: string;
  /** 当前版本 ID */
  current_version_id?: string;
}

/**
 * 文档上传请求载荷 (元数据部分)
 * 用于上传文档时的元数据设置
 */
export interface DocumentUploadRequest {
  /** 文档标题 */
  title?: string | null;
  /** 文档描述 */
  description?: string | null;
  /** 父节点 ID */
  from_node_id?: string | null;
}

/**
 * 文档版本上传请求载荷 (内容部分)
 * 用于上传文档的具体内容
 */
export interface DocumentVersionUploadRequest {
  /** 文档全文内容 */
  full_text: string;
}

/**
 * 文档详情响应
 * 包含文档元数据和当前版本内容的完整信息
 */
export interface DocumentDetailResponse {
  /** 文档 ID */
  id?: string;
  /** 所属作品 ID */
  work_id?: string;
  /** 文档标题 */
  title: string;
  /** 文档描述 */
  description?: string;
  /** 父节点 ID */
  from_node_id?: string;
  /** 当前版本的全文内容 */
  full_text?: string;
  /** 当前版本号 */
  now_version?: string;
  /** 当前版本 ID */
  current_version_id?: string;
}

/**
 * 文档版本列表项
 * 用于版本历史列表展示
 */
export interface DocumentVersionItem {
  /** 版本 ID */
  id: string;
  /** 版本号 */
  version: string;
  /** 创建时间 */
  create_at: string;
}

/**
 * 文档版本列表响应
 * GET /document/{id}/versions 的响应结构
 */
export interface DocumentVersionResponse {
  /** 版本列表 */
  versions: DocumentVersionItem[];
}

/**
 * 创建文档版本请求载荷
 * 用于基于现有文档创建新版本
 */
export interface DocumentVersionCreateRequest {
  /** 版本名称/号 */
  version_name?: string;
}

/**
 * 创建节点请求载荷
 * 用于创建文件夹/卷
 */
export interface NodeCreateRequest {
  /** 节点名称 */
  name: string;
  /** 节点描述 */
  description?: string | null;
  /** 节点类型 (通常固定为 folder) */
  type: "folder";
  /** 父节点 ID */
  from_node_id?: string | null;
}

/**
 * 节点响应 DTO
 * 创建或更新节点后的返回结果
 */
export interface NodeResponse {
  /** 节点 ID */
  id: string;
  /** 节点名称 */
  name: string;
  /** 节点描述 */
  description?: string | null;
  /** 节点类型 */
  type: "folder";
  /** 父节点 ID */
  from_node_id?: string | null;
}

/**
 * 更新节点请求载荷
 * 用于修改节点信息
 */
export interface NodeUpdateRequest {
  /** 新名称 */
  name?: string | null;
  /** 新描述 */
  description?: string | null;
  /** 新父节点 ID (用于移动节点) */
  from_node_id?: string | null;
}

/**
 * 关系响应
 * 用于获取部分节点和关系
 */
export interface RelationshipResponse {
  /** 节点列表 */
  document: NodeDTO[];
  /** 关系列表 */
  relationship: EdgeDTO[];
}

/**
 * 作品插件元数据响应
 * 简略的插件信息
 */
export interface WorkPluginMetaResponse {
  /** 插件 ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 插件描述 */
  description: string;
}

/**
 * 作品插件详情响应
 * 包含配置的完整插件信息
 */
export interface WorkPluginDetailResponse {
  /** 插件 ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件描述 */
  description: string;
  /** 是否启用 */
  enabled: boolean;
  /** 插件配置数据 */
  config: Record<string, unknown>;
  /** 来源类型: system(系统内置), custom(自定义) */
  from_type: "system" | "custom";
  /** 作用域类型: global, work, document */
  scope_type: "global" | "work" | "document";
  /** 标签列表 */
  tags: string[];
}

/**
 * 更新作品插件请求载荷
 * 用于修改插件的启用状态和配置
 */
export interface UpdateWorkPluginRequest {
  /** 是否启用 */
  enabled: boolean;
  /** 新的配置数据 */
  config: Record<string, unknown>;
}
