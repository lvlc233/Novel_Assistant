import { PluginInstance } from '@/types/plugin';

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

export async function getPlugins(): Promise<PluginInstance[]> {
  // TODO: Replace with actual API call
  // return request.get<PluginInstance[]>('/plugins');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_PLUGINS]), 500);
  });
}

export async function togglePluginStatus(id: string, enable: boolean): Promise<void> {
    // TODO: API call
    // await request.post(`/plugins/${id}/${enable ? 'enable' : 'disable'}`);
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    if (plugin) {
        plugin.status = enable ? 'enabled' : 'disabled';
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
}

export async function uninstallPlugin(id: string): Promise<void> {
    // TODO: API call
    const index = MOCK_PLUGINS.findIndex(p => p.id === id);
    if (index > -1) {
        MOCK_PLUGINS.splice(index, 1);
    }
    return new Promise((resolve) => setTimeout(resolve, 300));
}
