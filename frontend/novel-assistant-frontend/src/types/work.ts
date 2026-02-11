/**
 * 作品 (Work) 领域模型定义
 * 
 * 该文件定义了与小说作品、章节、卷等核心业务相关的前端领域模型。
 * 它是前端 UI 组件直接使用的数据结构，经过了从后端 DTO 的转换和处理。
 * 包含了作品的基本信息、章节内容、版本控制以及插件配置等。
 */

/**
 * 知识库简略信息 (Knowledge Base)
 * 关联到作品的知识库引用
 */
export interface KnowledgeBase {
  /** 知识库唯一标识符 */
  id: string;
  /** 知识库名称 */
  name: string;
  /** 标签列表 */
  tags: string[];
  /** 知识库描述或摘要内容 */
  content?: string;
}

/**
 * 章节版本 (Chapter Version)
 * 记录章节的历史变更版本
 */
export interface ChapterVersion {
  /** 版本唯一标识符 */
  id: string;
  /** 版本号或版本名称 */
  version: string;
  /** 版本备注说明 */
  note?: string;
  /** 版本对应的章节正文内容 */
  content: string;
  /** 版本更新时间 (ISO 8601) */
  updatedAt: string;
}

/**
 * 章节 (Chapter)
 * 表示小说中的一个具体章节
 */
export interface Chapter {
  /** 章节唯一标识符 */
  id: string;
  /** 章节标题 */
  title: string;
  /** 
   * 章节版本历史列表
   * 包含所有已保存的版本记录
   */
  versions: ChapterVersion[];
  /** 当前选中的版本 ID */
  currentVersionId: string;
  /** 当前选中的版本名称 */
  currentVersionName?: string;
  /** 所属卷 ID (如果属于某卷) */
  volumeId?: string;
  /** 章节排序序号 */
  order: number;
}

/**
 * 卷 (Volume)
 * 表示小说的一个分卷，包含多个章节
 */
export interface Volume {
  /** 卷唯一标识符 */
  id: string;
  /** 卷标题 */
  title: string;
  /** 
   * 卷内章节列表
   * 按顺序排列
   */
  chapters: Chapter[];
  /** 卷排序序号 */
  order: number;
  /** 
   * 是否展开 (UI 状态)
   * 控制在目录树中是否显示该卷下的章节
   */
  isExpanded: boolean;
}

/**
 * 小说 (Novel)
 * 这是一个视图模型 (View Model)，专用于小说类作品的展示。
 * 它将通用的 Work/Node/Document 数据结构映射为小说作者熟悉的
 * 卷 (Volume) 和 章节 (Chapter) 概念。
 * 
 * 对应关系:
 * - Work (作品) -> Novel (小说)
 * - Node (type=folder) -> Volume (卷)
 * - Node (type=document) -> Chapter (章节)
 */
export interface Novel {
  /** 作品唯一标识符 */
  id: string;
  /** 作品标题 */
  title: string;
  /** 封面图片 URL */
  cover?: string;
  /** 作品简介/摘要 */
  synopsis?: string;
  /** 连载状态 */
  status: '连载中' | '完结' | '断更';
  /** 创建时间 */
  createdAt: string;
  /** 最后更新时间 */
  updatedAt: string;
  /** 关联的知识库列表 */
  knowledgeBases?: KnowledgeBase[];
  /** 
   * 卷列表 (结构化目录)
   * 包含分卷及其下属章节
   */
  volumes?: Volume[];
  /** 
   * 游离章节列表 (非结构化目录)
   * 不属于任何分卷的独立章节
   */
  orphanChapters?: Chapter[];
  /** 作品类型 (如: 玄幻, 都市) */
  type?: string;
  /** 作品题材/流派 */
  genre?: string;
  /** 
   * 作品级插件配置
   * 针对该作品启用的特定插件及其设置
   */
  plugins?: { 
    id: string; 
    enabled: boolean; 
    config: Record<string, unknown> 
  }[];
}
