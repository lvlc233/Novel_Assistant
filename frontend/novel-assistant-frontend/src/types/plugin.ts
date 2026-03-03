/**
 * 插件 (Plugin) 领域模型定义
 * 
 * 该文件定义了与插件系统相关的前端业务模型。
 * 插件用于扩展应用功能，可以由系统预置或用户自定义。
 * 包含插件清单、实例配置、安装状态以及注册表项结构。
 */

/**
 * 插件类型
 * - 'system': 系统内置插件，通常不可卸载，提供核心功能
 * - 'user': 用户自定义或第三方安装的插件
 */
export type PluginType = 'system' | 'user';

/**
 * 插件状态
 * - 'enabled': 已启用，功能生效中
 * - 'disabled': 已禁用，已安装但不生效
 * - 'not_installed': 未安装，仅在注册表中可见
 */
export type PluginStatus = 'enabled' | 'disabled' | 'not_installed';

/**
 * UI 渲染类型
 * - 'LIST': 列表视图
 * - 'DETAIL': 详情视图
 * - 'DASHBOARD': 仪表盘视图
 */
export type RenderType = 'CONFIG' | 'AGENT_MESSAGES' | 'CARD' | 'LIST' | 'DETAIL' | 'DASHBOARD' | 'COMPONENT';

export interface ComponentSchema {
  type: string;
  props: Record<string, any>;
  children?: ComponentSchema[];
}

export interface ComponentPayload {
  root: ComponentSchema;
}


/**
 * 标准数据项
 * 用于插件数据的统一渲染
 */
export interface KeyValueItem {
  key: string;
  value: string | number | boolean | null;
}

export interface PluginConfigItem {
  key: string;
  value: string | number | boolean | null;
}

export type PluginConfig = { items: PluginConfigItem[] } | Record<string, unknown>;

export interface ConfigField {
  key: string;
  label?: string | null;
  description?: string | null;
  value_type: string;
  value: string | number | boolean | null;
  readOnly?: boolean;
  children: ConfigField[];
}

export interface ConfigPayload {
  fields: ConfigField[];
  actions?: Record<string, Action>;
}

export interface AgentSession {
  session_id: string;
  title?: string | null;
  source?: string | null;
  created_at?: string | null;
  token_usage?: number | null;
}

export interface AgentMessagesPayload {
  sessions: AgentSession[];
}

export interface Action {
  type: 'invoke_operation' | 'link' | 'router';
  operation?: string;
  url?: string;
  params?: Record<string, any>;
  label?: string;
  danger?: boolean;
  confirm?: string;
}

export interface CardItem {
  id: string;
  title: string;
  summary?: string | null;
  tags: string[];
  parent_id?: string | null;
  actions?: Record<string, Action | Action[]>;
}

export interface CardPayload {
  cards: CardItem[];
}

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  tags: string[];
  metadata: KeyValueItem[];
}

export interface ListPayload {
  items: ListItem[];
}

export interface DetailItem {
  id: string;
  title: string;
  content?: string | null;
  fields: KeyValueItem[];
}

export interface DetailPayload {
  detail: DetailItem;
}

export interface DashboardWidget {
  id: string;
  title: string;
  value: string | number | boolean | null;
  unit?: string | null;
  tags: string[];
}

export interface DashboardPayload {
  widgets: DashboardWidget[];
}

export type RenderPayload =
  | ConfigPayload
  | AgentMessagesPayload
  | CardPayload
  | ListPayload
  | DetailPayload
  | DashboardPayload
  | ComponentPayload;

export interface StandardDataResponse {
  plugin_id: string;
  render_type: RenderType;
  payload: RenderPayload;
  total?: number;
}

/**
 * 插件清单 (Manifest)
 * 描述插件的静态元数据，类似于 package.json
 */
export interface PluginManifest {
  /** 插件唯一标识符 (通常为反向域名格式，如 com.example.plugin) */
  id: string;
  /** 插件显示名称 */
  name: string;
  /** 插件版本号 (语义化版本，如 1.0.0) */
  version: string;
  /** 插件功能描述 */
  description: string;
  /** 插件作者/开发团队 */
  // author: string;
  /** 插件图标 (URL 或图标名称) */
  icon?: string;
  /** 插件类型 (系统/用户) */
  // type: PluginType;
  
  /** 渲染类型 */
  render_type?: RenderType;
  
  /** 
   * 作用域类型 (可选)
   * 定义插件生效的范围，如 'global'(全局), 'work'(特定作品), 'document'(特定文档) 
   */
  scope_type?: string;
  /** 
   * 来源类型 (可选)
   * 定义插件的来源渠道 
   */
  from_type?: string;
  /** 插件标签列表，用于分类和检索 */
  tags?: string[];
  /** 
   * 能力声明
   * 声明插件支持的 UI 扩展点或功能特性
   */
  capabilities: {
    /** 是否支持侧边栏扩展 */
    sidebar?: boolean;
    /** 是否支持编辑器扩展 */
    editor?: boolean;
    /** 是否支持头部导航栏扩展 */
    header?: boolean;
  };
  
  /** 数据源入口操作名称 */
  data_source_entry_point?: string;
}

/**
 * 插件实例 (Instance)
 * 表示一个已安装并可能带有特定配置的插件实体
 */
export interface PluginInstance {
  /** 实例 ID (通常与 Manifest ID 相同，除非支持多实例) */
  id: string;
  /** 关联的插件信息清单 */
  manifest: PluginManifest;
  /** 当前运行状态 */
  status: PluginStatus;
  /** 
   * 插件配置数据 
   * 键值对形式，具体结构由插件自身定义
   */
  config: PluginConfig;
  /** 安装时间 (ISO 8601 格式字符串) */
  installedAt?: string;
}

/**
 * 插件注册表项
 * 用于插件市场或已安装列表的展示
 */
export interface PluginRegistryItem {
  /** 插件清单信息 */
  manifest: PluginManifest;
  /** 当前环境是否已安装该插件 */
  isInstalled: boolean;
}
