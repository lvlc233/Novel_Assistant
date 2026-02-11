/**
 * 记忆 (Memory) 领域模型定义
 * 
 * 该文件定义了与 Agent 记忆系统相关的前端业务模型。
 * 记忆系统允许 Agent 存储和管理长期或短期的上下文信息，以保持对话的一致性和个性化。
 * 包含记忆元数据、详细内容以及创建/更新请求结构。
 */

/**
 * 记忆类型
 * - 'long': 长期记忆，永久存储，通常用于核心设定或重要事实
 * - 'short': 短期记忆，可能会被清理或覆盖，用于近期对话上下文
 */
export type MemoryType = 'long' | 'short';

/**
 * 记忆元数据
 * 用于列表展示记忆条目
 */
export interface MemoryMeta {
  /** 记忆条目唯一标识符 (UUID) */
  memory_id: string;
  /** 是否启用该记忆 */
  enable: boolean;
  /** 记忆名称/标题 */
  memory_name: string;
  /** 记忆描述/摘要 */
  memory_description?: string;
  /** 创建时间 (ISO 8601 格式字符串) */
  create_at: string;
}

/**
 * 记忆详细信息
 * 用于查看和编辑具体的记忆内容
 */
export interface MemoryDetail extends MemoryMeta {
  /** 记忆类型 (长期/短期) */
  memory_type: MemoryType;
  /** 记忆的具体内容文本 */
  memory_content?: string;
}

/**
 * 创建记忆请求载荷
 * 用于添加新的记忆条目
 */
export interface MemoryCreateRequest {
  /** 记忆名称 */
  memory_name: string;
  /** 记忆类型 */
  memory_type: MemoryType;
  /** 记忆描述 */
  memory_description?: string;
  /** 记忆内容 (对应后端的 context) */
  memory_context?: string;
}

/**
 * 更新记忆请求载荷
 * 用于修改现有记忆条目
 */
export interface MemoryUpdateRequest {
  /** 是否启用 */
  enable?: boolean;
  /** 新的名称 */
  memory_name?: string;
  /** 新的描述 */
  memory_description?: string;
  /** 新的内容 */
  memory_context?: string;
}
