import { request } from '@/lib/request';
import { PluginConfig, PluginInstance, StandardDataResponse, RenderType } from '@/types/plugin';

// Feature flag for using mock data
const USE_MOCK = false;
const MOCK_PLUGINS: PluginInstance[] = [];

// Backend DTOs
interface PluginMetaResponse {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  enabled: boolean;
  render_type: RenderType;
}

interface PluginResponse extends PluginMetaResponse {
  description?: string;
  config: PluginConfig;
  render_type: RenderType;
  from_type: 'system' | 'custom' | 'official';
  scope_type: 'global' | 'work' | 'document';
  tags: string[];
}

export interface PluginShopItem {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  enabled: boolean;
  installed: boolean;
  installed_version?: string | null;
  latest_version?: string | null;
  upgrade_available?: boolean;
}


// Mapper
const mapMetaToInstance = (meta: PluginMetaResponse): PluginInstance => {
  return {
    id: meta.id,
    status: meta.enabled ? 'enabled' : 'disabled',
    config: { items: [] }, 
    installedAt: new Date().toISOString(), 
    manifest: {
      id: meta.id,
      name: meta.name,
      version: meta.version,
      description: meta.description || '', 
      author: 'System', 
      type: 'system', 
      render_type: meta.render_type,
      capabilities: { 
        sidebar: true,
        editor: true,
        header: false
      }
    }
  };
};

const mapResponseToInstance = (data: PluginResponse): PluginInstance => {
  return {
    id: data.id,
    status: data.enabled ? 'enabled' : 'disabled',
    config: data.config,
    installedAt: new Date().toISOString(),
    manifest: {
      id: data.id,
      name: data.name,
      version: '1.0.0',
      description: data.description || '',
      author: data.from_type === 'system' ? 'System' : 'Official',
      type: 'system', 
      render_type: data.render_type,
      capabilities: {
        sidebar: true,
        editor: true,
        header: false
      }
    }
  };
};

export async function getPlugins(): Promise<PluginInstance[]> {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_PLUGINS]), 500);
    });
  }
  const response = await request.get<PluginMetaResponse[]>('/plugin/expand');
  return response.map(mapMetaToInstance);
}

export async function getSystemPlugins(): Promise<PluginInstance[]> {
  if (USE_MOCK) {
    return []; 
  }
  const response = await request.get<PluginResponse[]>('/plugin/system');
  return response.map(mapResponseToInstance);
}

/**
 * 获取插件市场列表
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-18 20:20
 * 说明: 在仪表盘插件市场弹窗中使用，获取插件注册状态与版本差异信息。
 */
export async function getShopPlugins(): Promise<PluginShopItem[]> {
  if (USE_MOCK) {
    return []; 
  }
  return request.get<PluginShopItem[]>('/plugin/shop');
}

/**
 * 注册插件市场插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-18 18:31
 * 说明: 在插件市场卡片点击“注册插件”时调用，触发后端注册流程。
 */
export async function registerShopPlugin(pluginId: string): Promise<string> {
  if (USE_MOCK) {
    return pluginId;
  }
  await request.post(`/plugin/shop/${pluginId}/register`);
  return pluginId;
}

/**
 * 移除插件市场插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-19 01:39
 * 说明: 在插件市场卡片点击“移除”时调用，删除后端注册记录。
 */
export async function unregisterShopPlugin(pluginId: string): Promise<string> {
  if (USE_MOCK) {
    return pluginId;
  }
  await request.post(`/plugin/shop/${pluginId}/unregister`);
  return pluginId;
}

/**
 * 获取插件数据 (BFF Proxy)
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-12 10:00:00
 * 说明: 通过后端代理获取插件数据，无需直接请求第三方接口。
 *      后端会自动处理鉴权和配置注入。
 */
export async function getPluginData(
  pluginId: string,
  params?: Record<string, string | number | boolean>
): Promise<StandardDataResponse> {
  // if (USE_MOCK) { ... }
  return request.get<StandardDataResponse>(`/plugin/proxy/${pluginId}/data`, { params });
}

export async function togglePluginStatus(id: string, enable: boolean): Promise<void> {
  if (USE_MOCK) {
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    if (plugin) {
        plugin.status = enable ? 'enabled' : 'disabled';
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
  await request.patch(`/plugin/${id}`, {
    enabled: enable
  });
}

export async function updatePlugin(id: string, data: { enabled?: boolean; config?: PluginConfig }): Promise<void> {
  if (USE_MOCK) {
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    if (plugin) {
        if (data.enabled !== undefined) plugin.status = data.enabled ? 'enabled' : 'disabled';
        if (data.config) plugin.config = { ...plugin.config, ...data.config };
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
  await request.patch(`/plugin/${id}`, data);
}

/**
 * 卸载插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-19 01:39
 * 说明: 在插件管理页卸载插件时使用，改用插件市场移除接口。
 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  if (USE_MOCK) {
    const index = MOCK_PLUGINS.findIndex(p => p.id === pluginId);
    if (index > -1) {
        MOCK_PLUGINS.splice(index, 1);
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
  await request.post(`/plugin/shop/${pluginId}/unregister`);
}
