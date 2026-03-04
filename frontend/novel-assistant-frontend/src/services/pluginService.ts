import { request } from '@/lib/request';
import { ConfigField, Operation } from '@/types/plugin';


// Backend DTOs
interface PluginMetaResponse {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  enabled: boolean;
}

export interface PluginOperation {
  name: string;
  description?: string | null;
  with_ui: string[];
  ui_target?: string | null;
  trigger?: string | null;
  is_stream: boolean;
  input_schema: Record<string, any>;
  output_schema?: Record<string, any> | null;
}

interface PluginResponse extends PluginMetaResponse {
  description?: string;
  config: ConfigField[];
  from_type: 'system' | 'custom' | 'official';
  tags: string[];
  operations: PluginOperation[];
}

export interface InternalPluginItem {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  from_type: 'system' | 'custom' | 'official';
  loader_type: 'internal' | 'url' | 'json';
  tags: string[];
  config_schema: ConfigField[];
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
  operations?: PluginOperation[];
}

export interface PluginOperationInvokeResponse {
  plugin_id: string;
  operation: string;
  payload: Record<string, unknown>;
}

/**
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-23 21:44:00
 * 说明: 已废弃
 */
// export interface PluginFeatureFlags {}





const PLUGIN_CACHE_KEY = 'plugin_shop_cache';
let pluginCache: PluginShopItem[] | null = null;

// 初始化缓存
const initCache = () => {
  if (typeof window === 'undefined') return;
  const cached = localStorage.getItem(PLUGIN_CACHE_KEY);
  if (cached) {
    try {
      pluginCache = JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse plugin cache', e);
      localStorage.removeItem(PLUGIN_CACHE_KEY);
    }
  }
};

// 保存缓存
const saveCache = (plugins: PluginShopItem[]) => {
  pluginCache = plugins;
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLUGIN_CACHE_KEY, JSON.stringify(plugins));
  }
};

/**
 * 获取插件市场列表 (支持缓存)
 * 注释者: FrontendAgent(react)
 * 时间: 2026-03-04
 * 说明: 优先读取内存/本地缓存，若无缓存或强制刷新则请求后端。
 */
export async function getPluginsFromShop(forceRefresh = false): Promise<PluginShopItem[]> {
  // 1. 如果不是强制刷新，且有缓存，直接返回缓存
  if (!forceRefresh) {
    if (!pluginCache) initCache();
    if (pluginCache && pluginCache.length > 0) {
      return pluginCache;
    }
  }

  // 2. 请求后端
  const plugins = await request.get<PluginShopItem[]>('/plugin/shop');
  
  // 3. 更新缓存
  updateCacheAndNotify(plugins);
  
  return plugins;
}

/**
 * 搜索已缓存的插件
 */
export function searchCachedPlugins(query: string): PluginShopItem[] {
  if (!pluginCache) initCache();
  if (!pluginCache) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return pluginCache;

  return pluginCache.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) || 
    p.description?.toLowerCase().includes(lowerQuery) ||
    p.from_type?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 注册插件市场插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-18 18:31
 * 说明: 在插件市场卡片点击“注册插件”时调用，触发后端注册流程。
 */
export async function registerShopPlugin(pluginId: string): Promise<string> {
  await request.post(`/plugin/shop/${pluginId}/register`);
  // 注册成功后，强制刷新一次缓存以获取最新状态
  await getPluginsFromShop(true);
  return pluginId;
}

/**
 * 移除插件市场插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-19 01:39
 * 说明: 在插件市场卡片点击“移除”时调用，删除后端注册记录。
 */
export async function unregisterShopPlugin(pluginId: string): Promise<string> {
  console.log(pluginId)
  await request.post(`/plugin/shop/${pluginId}/unregister`);
  console.log("执行删除后")
  // 移除成功后，强制刷新一次缓存以获取最新状态
  await getPluginsFromShop(true);
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
  const bodyObj = Object.fromEntries(body);
  return request.post<any>(`/plugin/proxy/${pluginId}/${operationName}`, bodyObj);
}

// 事件总线: 插件变更通知
const PLUGIN_CHANGED_EVENT = 'plugin-changed';

export const notifyPluginChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PLUGIN_CHANGED_EVENT));
  }
};

export const subscribeToPluginChanges = (callback: () => void) => {
  if (typeof window !== 'undefined') {
    window.addEventListener(PLUGIN_CHANGED_EVENT, callback);
    return () => window.removeEventListener(PLUGIN_CHANGED_EVENT, callback);
  }
  return () => {};
};

// 辅助函数: 保存缓存并通知变更
const updateCacheAndNotify = (plugins: PluginShopItem[]) => {
    saveCache(plugins);
    notifyPluginChanged();
};
