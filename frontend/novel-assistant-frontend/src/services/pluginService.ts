import { request } from '@/lib/request';
import { PluginInstance, PluginManifest, PluginType, PluginStatus } from '@/types/plugin';

// Feature flag for using mock data
const USE_MOCK = false;

// Backend DTOs
interface PluginMetaResponse {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  from_type: 'system' | 'custom';
  scope_type: 'global' | 'work' | 'document';
}

interface PluginResponse extends PluginMetaResponse {
  config: Record<string, any>;
  tags: string[];
}

// Mock Data
const MOCK_PLUGINS: PluginInstance[] = [
  {
    id: 'writer-agent',
    status: 'enabled',
    config: {},
    installedAt: '2026-01-20T10:00:00Z',
    manifest: {
      id: 'writer-agent',
      name: 'Writer Agent',
      version: '1.0.0',
      description: 'AI 写作助手，提供续写、润色功能',
      author: 'Official',
      type: 'system',
      capabilities: { editor: true, sidebar: true }
    }
  },
  {
    id: 'reviewer-agent',
    status: 'disabled',
    config: {},
    installedAt: '2026-01-21T10:00:00Z',
    manifest: {
      id: 'reviewer-agent',
      name: 'Reviewer Agent',
      version: '0.9.0',
      description: '审稿助手，检查逻辑漏洞和错别字',
      author: 'Official',
      type: 'system',
      capabilities: { editor: true }
    }
  },
  {
    id: 'world-builder',
    status: 'enabled',
    config: {},
    installedAt: '2026-01-22T10:00:00Z',
    manifest: {
      id: 'world-builder',
      name: 'World Builder',
      version: '1.2.0',
      description: '世界观构建工具，管理角色和设定',
      author: 'Community',
      type: 'user',
      capabilities: { sidebar: true }
    }
  }
];

// Mapper
const mapMetaToInstance = (meta: PluginMetaResponse): PluginInstance => {
  return {
    id: meta.id,
    status: meta.enabled ? 'enabled' : 'disabled',
    config: {}, // Meta doesn't have config, will need detail fetch or default
    installedAt: new Date().toISOString(), // Backend doesn't have installedAt
    manifest: {
      id: meta.id,
      name: meta.name,
      version: '1.0.0', // Default
      description: meta.description || '',
      author: meta.from_type === 'system' ? 'System' : 'User',
      type: meta.from_type === 'system' ? 'system' : 'user',
      capabilities: { // Default capabilities
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
  const response = await request.get<PluginMetaResponse[]>('/plugins');
  return response.map(mapMetaToInstance);
}

export async function togglePluginStatus(id: string, enable: boolean): Promise<void> {
  if (USE_MOCK) {
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    if (plugin) {
        plugin.status = enable ? 'enabled' : 'disabled';
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
  await request.patch(`/plugins/${id}`, {
    enabled: enable
  });
}

/**
 * 卸载插件
 * 注释者: FrontendAgent(react)
 * 时间: 2026-01-26 19:40:00
 * 说明: 卸载指定ID的插件。对接后端 DELETE /plugins/{plugin_id} 接口。
 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  if (USE_MOCK) {
    const index = MOCK_PLUGINS.findIndex(p => p.id === pluginId);
    if (index > -1) {
        MOCK_PLUGINS.splice(index, 1);
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
  }
  await request.delete(`/plugins/${pluginId}`);
}

