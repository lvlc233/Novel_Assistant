export type PluginType = 'system' | 'user';
export type PluginStatus = 'enabled' | 'disabled' | 'not_installed';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string; // URL or icon name
  type: PluginType;
  // Capability flags
  capabilities: {
    sidebar?: boolean;
    editor?: boolean;
    header?: boolean;
  };
}

export interface PluginInstance {
  id: string; // usually same as manifest id
  manifest: PluginManifest;
  status: PluginStatus;
  config: Record<string, unknown>;
  installedAt?: string;
}

export interface PluginRegistryItem {
    manifest: PluginManifest;
    isInstalled: boolean;
}
