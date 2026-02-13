import { request } from '@/lib/request';
import { PluginConfig, PluginInstance, StandardDataResponse, RenderType } from '@/types/plugin';

// Feature flag for using mock data
const USE_MOCK = false;
const MOCK_PLUGINS: PluginInstance[] = [];

// Backend DTOs
interface PluginMetaResponse {
  id: string;
  name: string;
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
      version: '1.0.0', 
      description: '', 
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
 * 时间: 2026-01-26 19:40:00
 * 说明: 卸载指定ID的插件。对接后端 DELETE /plugin/{plugin_id} 接口。
 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  if (USE_MOCK) {
    const index = MOCK_PLUGINS.findIndex(p => p.id === pluginId);
    if (index > -1) {
        MOCK_PLUGINS.splice(index, 1);
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
  // Warning: Backend might not support DELETE yet
  await request.delete(`/plugin/${pluginId}`);
}
