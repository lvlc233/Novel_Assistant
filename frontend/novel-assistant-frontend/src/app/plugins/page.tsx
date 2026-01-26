"use client";
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getPlugins, togglePluginStatus, uninstallPlugin } from '@/services/pluginService';
import { PluginInstance } from '@/types/plugin';
import { logger } from '@/lib/logger';
import { Power, Trash2, Settings, Puzzle } from 'lucide-react';
import { cn } from '@/lib/utils';
import PluginSettingsModal from '@/components/plugins/PluginSettingsModal';

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInstance | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setIsLoading(true);
      const data = await getPlugins();
      setPlugins(data);
    } catch (err) {
      logger.error('Failed to load plugins', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (plugin: PluginInstance) => {
    try {
        setProcessingId(plugin.id);
        const newStatus = plugin.status === 'enabled' ? 'disabled' : 'enabled';
        await togglePluginStatus(plugin.id, newStatus === 'enabled');
        // Optimistic update or reload
        setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, status: newStatus } : p));
        logger.info(`Plugin ${plugin.id} ${newStatus}`);
    } catch (err) {
        logger.error('Failed to toggle plugin', err);
    } finally {
        setProcessingId(null);
    }
  };

  const handleUninstall = async (id: string) => {
      if (!confirm('Are you sure you want to uninstall this plugin?')) return;
      try {
          setProcessingId(id);
          await uninstallPlugin(id);
          setPlugins(prev => prev.filter(p => p.id !== id));
          logger.info(`Plugin ${id} uninstalled`);
      } catch (err) {
          logger.error('Failed to uninstall plugin', err);
      } finally {
          setProcessingId(null);
      }
  };

  const openSettings = (plugin: PluginInstance) => {
      setSelectedPlugin(plugin);
      setIsSettingsOpen(true);
  };

  const saveSettings = async (config: Record<string, unknown>) => {
      if (!selectedPlugin) return;
      // TODO: API call to save config
      logger.info('Saving config for', selectedPlugin.id, config);
      // Optimistic update
      setPlugins(prev => prev.map(p => p.id === selectedPlugin.id ? { ...p, config } : p));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif text-text-primary flex items-center gap-2">
                <Puzzle className="w-6 h-6 text-accent-primary" />
                插件管理
            </h1>
            <p className="text-text-secondary mt-1">管理系统扩展功能与 Agent</p>
          </div>
          <button className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors shadow-sm">
             浏览插件市场
          </button>
        </div>

        {isLoading ? (
             <div className="flex items-center justify-center h-64">
                 <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : plugins.length === 0 ? (
             <div className="text-center py-12 bg-surface-secondary rounded-xl border border-dashed border-border-primary">
                 <Puzzle className="w-12 h-12 text-text-disabled mx-auto mb-3" />
                 <p className="text-text-secondary">暂无已安装插件</p>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plugins.map((plugin) => (
                    <div 
                        key={plugin.id}
                        className={cn(
                            "bg-surface-white rounded-xl p-5 border transition-all hover:shadow-card-hover",
                            plugin.status === 'enabled' ? "border-border-primary" : "border-border-primary opacity-75 bg-surface-secondary/30"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    plugin.status === 'enabled' ? "bg-accent-secondary/10 text-accent-secondary" : "bg-gray-200 text-gray-400"
                                )}>
                                    <Puzzle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-primary">{plugin.manifest.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <span className="bg-surface-secondary px-1.5 py-0.5 rounded border border-border-primary">v{plugin.manifest.version}</span>
                                        <span>{plugin.manifest.author}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                plugin.status === 'enabled' ? "bg-success" : "bg-text-disabled"
                            )} title={plugin.status} />
                        </div>
                        
                        <p className="text-sm text-text-secondary mb-6 line-clamp-2 h-10">
                            {plugin.manifest.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border-primary">
                             <div className="flex gap-1">
                                <button 
                                    onClick={() => openSettings(plugin)}
                                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
                                    title="配置"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                {plugin.manifest.type !== 'system' && (
                                    <button 
                                        onClick={() => handleUninstall(plugin.id)}
                                        className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-full transition-colors"
                                        title="卸载"
                                        disabled={!!processingId}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                             </div>
                             
                             <button
                                onClick={() => handleToggle(plugin)}
                                disabled={!!processingId}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                    plugin.status === 'enabled' 
                                        ? "bg-surface-secondary text-text-primary hover:bg-error/10 hover:text-error group"
                                        : "bg-accent-primary text-white hover:bg-accent-primary/90"
                                )}
                             >
                                <Power className="w-3.5 h-3.5" />
                                <span>{plugin.status === 'enabled' ? '禁用' : '启用'}</span>
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Settings Modal */}
        {selectedPlugin && (
            <PluginSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                plugin={selectedPlugin}
                onSave={saveSettings}
            />
        )}
      </div>
    </AppLayout>
  );
}

