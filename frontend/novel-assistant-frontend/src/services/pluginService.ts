import { request } from '@/lib/request';
import { PluginConfig, PluginInstance, StandardDataResponse } from '@/types/plugin';


// Backend DTOs
interface PluginMetaResponse {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  enabled: boolean;
}

interface PluginResponse extends PluginMetaResponse {
  description?: string;
  config: PluginConfig;
  from_type: 'system' | 'custom' | 'official';
  scope_type: 'global' | 'work' | 'document';
  tags: string[];
}

export interface InternalPluginItem {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  from_type: 'system' | 'custom' | 'official';
  scope_type: 'global' | 'work' | 'document';
  loader_type: 'internal' | 'url' | 'json';
  tags: string[];
  config_schema: Record<string, unknown>;
  plugin_operation_schema: Record<string, unknown>;
}

export interface PluginShopItem {
  id: string;
  name: string;
  // 当前版本
  version: string;
  // 最新版本
  latest_version: string;
  description?: string | null;
  // 插件来源:分为系统的和非系统的,系统的总是启动且不可卸载
  from_type:string
  // 是否已安装
  installed: boolean;


}

export interface PluginOperationInvokeResponse {
  plugin_id: string;
  operation: string;
  payload: Record<string, unknown>;
}

/**
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-23 21:44:00
 * 说明: 在何处使用: 前端功能开关统一判断；如何使用: getPluginFeatureFlags 获取功能可用性；实现概述: 基于插件市场列表聚合核心功能的可见性状态。
 */
export interface PluginFeatureFlags {
  quickInput: boolean;
  mail: boolean;
  docAssistant: boolean;
}

// const PLUGIN_FEATURE_FLAGS_EVENT = 'plugin-feature-flags-changed';

// const FEATURE_PLUGIN_KEYS: Record<keyof PluginFeatureFlags, string[]> = {
//   quickInput: ['project_helper', '项目助手', 'project_agent'],
//   mail: ['agent_manager', 'Agent管理插件', '邮箱系统', 'mail'],
//   docAssistant: ['document_helper', 'doc_agent', '文档创作助手', '文档助手']
// };

let featureFlagsCache: PluginFeatureFlags | null = null;
let featureFlagsPromise: Promise<PluginFeatureFlags> | null = null;





/**
 * 获取插件市场列表
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-18 20:20
 * 说明: 在仪表盘插件市场弹窗中使用，获取插件注册状态与版本差异信息。
 */
export async function getPluginsFromShop(): Promise<PluginShopItem[]> {
  return request.get<PluginShopItem[]>('/plugin/shop');
}

/**
 * 注册插件市场插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-18 18:31
 * 说明: 在插件市场卡片点击“注册插件”时调用，触发后端注册流程。
 */
export async function registerShopPlugin(pluginId: string): Promise<string> {
  await request.post(`/plugin/shop/${pluginId}/register`);
  // invalidatePluginFeatureFlags();
  // notifyPluginFeatureFlagsChanged();
  return pluginId;
}

/**
 * 移除插件市场插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-19 01:39
 * 说明: 在插件市场卡片点击“移除”时调用，删除后端注册记录。
 */
export async function unregisterShopPlugin(pluginId: string): Promise<string> {
  await request.post(`/plugin/shop/${pluginId}/unregister`);
  // invalidatePluginFeatureFlags();
  // notifyPluginFeatureFlagsChanged();
  return pluginId;
}
/**
 * 获取指定插件的详情
 * 注释者: ;xz
 * 时间: 2026-03-04
 * 说明: 获取指定插件的详细信息
 */
export async function getPluginDetail(pluginId:string) {
  return request.get<PluginResponse>(`/plugin/${pluginId}`);
}



// 更新相关
export async function togglePluginStatus(id: string, enable: boolean): Promise<void> {

  await request.patch(`/plugin/${id}`, {
    enabled: enable
  });
  // invalidatePluginFeatureFlags();
  // notifyPluginFeatureFlagsChanged();
}

export async function updatePlugin(id: string, data: { enabled?: boolean; config?: PluginConfig }): Promise<void> {
  await request.patch(`/plugin/${id}`, data);
  if (data.enabled !== undefined) {
    // invalidatePluginFeatureFlags();
    // notifyPluginFeatureFlagsChanged();
  }
}

// 调度接口代理
export async function invokePlugin(
  pluginId: string,
  operationName: string,
  body: Map<string, any>
): Promise<PluginOperationInvokeResponse> {
  return request.post<any>(`/plugin/proxy/${pluginId}/${operationName}`, {
    body: body
  });
}

// 常量申明

const normalizePluginKey = (value: string) => value.trim().toLowerCase();

const matchPluginKey = (plugin: PluginShopItem, keys: string[]) => {
  const pluginId = normalizePluginKey(plugin.id);
  const pluginName = normalizePluginKey(plugin.name);
  return keys.some((key) => {
    const normalizedKey = normalizePluginKey(key);
    return normalizedKey === pluginId || normalizedKey === pluginName;
  });
};

// const resolveFeatureEnabled = (plugins: PluginShopItem[], keys: string[]) => {
//   return plugins.some((plugin) => matchPluginKey(plugin, keys) && plugin.installed && plugin.enabled);
// };

/**
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-23 22:12:00
 * 说明: 在何处使用: 插件状态自动刷新；如何使用: 订阅事件并强制重新拉取；实现概述: 提供缓存失效与变更事件，支持 UI 即时刷新。
 */
// export const invalidatePluginFeatureFlags = () => {
//   featureFlagsCache = null;
// };

// export const notifyPluginFeatureFlagsChanged = () => {
//   if (typeof window === 'undefined') return;
//   window.dispatchEvent(new CustomEvent(PLUGIN_FEATURE_FLAGS_EVENT));
// };

// export const subscribePluginFeatureFlagsChanged = (listener: () => void) => {
//   if (typeof window === 'undefined') return () => {};
//   window.addEventListener(PLUGIN_FEATURE_FLAGS_EVENT, listener);
//   return () => window.removeEventListener(PLUGIN_FEATURE_FLAGS_EVENT, listener);
// };

// export async function getPluginFeatureFlags(options?: { force?: boolean }): Promise<PluginFeatureFlags> {
//   if (!options?.force && featureFlagsCache) {
//     return featureFlagsCache;
//   }
//   if (!options?.force && featureFlagsPromise) {
//     return featureFlagsPromise;
//   }
//   featureFlagsPromise = getShopPlugins()
//     .then((plugins) => {
//       const flags: PluginFeatureFlags = {
//         quickInput: resolveFeatureEnabled(plugins, FEATURE_PLUGIN_KEYS.quickInput),
//         mail: resolveFeatureEnabled(plugins, FEATURE_PLUGIN_KEYS.mail),
//         docAssistant: resolveFeatureEnabled(plugins, FEATURE_PLUGIN_KEYS.docAssistant)
//       };
//       featureFlagsCache = flags;
//       return flags;
//     })
//     .finally(() => {
//       featureFlagsPromise = null;
//     });
//   return featureFlagsPromise;
// }
