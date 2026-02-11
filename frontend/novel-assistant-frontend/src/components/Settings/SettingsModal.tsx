import React, { useState, useEffect } from 'react';
import { Settings, X, RotateCcw, Save, Loader2, Package, Tag, Globe, Server } from 'lucide-react';
import { logger } from '@/lib/logger';
import { getSystemPlugins, updatePlugin } from '@/services/pluginService';
import { PluginInstance } from '@/types/plugin';
import AgentConfigEditor from './AgentConfigEditor';
import WorkTypeConfigEditor from './WorkTypeConfigEditor';
import JsonConfigEditor from './JsonConfigEditor';

/**
 * 开发者: FrontendAgent(react)
 * 更新时间: 2026-01-30 16:50
 * 更新记录:
 * - 重构为动态加载系统插件配置
 * - 集成 AgentConfigEditor 和 WorkTypeConfigEditor
 * - 对接后端 /plugin/system 接口
 */

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [activePluginId, setActivePluginId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unsavedConfigs, setUnsavedConfigs] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false); // Local toast state

  // Load plugins when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPlugins();
    } else {
        // Reset state on close
        setUnsavedConfigs({});
    }
  }, [isOpen]);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const data = await getSystemPlugins();
      setPlugins(data);
      if (data.length > 0 && !activePluginId) {
        setActivePluginId(data[0].id);
      }
    } catch (error) {
      logger.error('Failed to load system plugins', error);
    } finally {
      setLoading(false);
    }
  };

  const activePlugin = plugins.find(p => p.id === activePluginId);
  const currentConfig = activePluginId && unsavedConfigs[activePluginId] 
    ? unsavedConfigs[activePluginId] 
    : activePlugin?.config || {};

  const handleConfigChange = (newConfig: any) => {
    if (!activePluginId) return;
    setUnsavedConfigs(prev => ({
      ...prev,
      [activePluginId]: newConfig
    }));
  };

  const handleReset = () => {
    if (!activePluginId) return;
    const newConfigs = { ...unsavedConfigs };
    delete newConfigs[activePluginId];
    setUnsavedConfigs(newConfigs);
    logger.debug('Reset config for:', activePluginId);
  };

  const handleSave = async () => {
    if (!activePluginId) return;
    
    try {
      setSaving(true);
      await updatePlugin(activePluginId, { config: currentConfig });
      
      // Update local plugin state to reflect saved config
      setPlugins(prev => prev.map(p => {
        if (p.id === activePluginId) {
            return { ...p, config: currentConfig };
        }
        return p;
      }));
      
      // Clear unsaved state
      const newConfigs = { ...unsavedConfigs };
      delete newConfigs[activePluginId];
      setUnsavedConfigs(newConfigs);

      // Show success feedback
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      
    } catch (error) {
      logger.error('Failed to save config', error);
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = () => {
    if (!activePlugin) return null;

    const name = activePlugin.manifest.name || '';
    
    // Select editor based on plugin name or id
    if (name.includes('Agent管理') || activePlugin.id === 'agent_manager') {
        return <AgentConfigEditor config={currentConfig} onChange={handleConfigChange} />;
    }
    
    if (name.includes('作品类型') || activePlugin.id === 'work_type_manager') {
        return <WorkTypeConfigEditor config={currentConfig} onChange={handleConfigChange} />;
    }

    return <JsonConfigEditor config={currentConfig} onChange={handleConfigChange} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="w-[1000px] h-[700px] bg-surface-white rounded-2xl border border-gray-200 shadow-2xl flex overflow-hidden animate-scale-up relative mx-4">
        
        {/* Top Left Icon */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            <span className="font-serif font-bold text-lg">System Settings</span>
        </div>

        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 pt-20 flex flex-col bg-gray-50/50">
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {plugins.map(plugin => (
                        <button 
                            key={plugin.id}
                            onClick={() => setActivePluginId(plugin.id)}
                            className={`w-full text-left px-6 py-4 font-serif text-sm font-bold transition-all border-l-4 group relative ${
                                activePluginId === plugin.id 
                                ? 'border-black bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]' 
                                : 'border-transparent hover:bg-gray-100 text-gray-500'
                            }`}
                        >
                            <span className="line-clamp-1">{plugin.manifest.name}</span>
                            {unsavedConfigs[plugin.id] && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" title="Unsaved changes"></span>
                            )}
                        </button>
                    ))}
                    {plugins.length === 0 && (
                        <div className="text-center text-gray-400 text-xs py-8 px-4">
                            No system plugins found.
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col relative bg-white min-w-0">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-20"
            >
                <X className="w-5 h-5 text-gray-500" />
            </button>

            {activePlugin ? (
                <>
                    {/* Plugin Header */}
                    <div className="px-10 pt-20 pb-6 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold mb-2">{activePlugin.manifest.name}</h2>
                                <p className="text-sm text-gray-500 font-serif leading-relaxed max-w-xl">
                                    {activePlugin.manifest.description || 'No description provided.'}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${activePlugin.status === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {activePlugin.status === 'enabled' ? 'Enabled' : 'Disabled'}
                            </div>
                        </div>
                        
                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-3 mt-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                <Globe size={12} />
                                <span>{activePlugin.manifest.scope_type || 'global'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                <Server size={12} />
                                <span>{activePlugin.manifest.from_type || 'system'}</span>
                            </div>
                            {activePlugin.manifest.tags?.map(tag => (
                                <div key={tag} className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                    <Tag size={12} />
                                    <span>{tag}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 px-2.5 py-1">
                                <Package size={12} />
                                <span>v{activePlugin.manifest.version}</span>
                            </div>
                        </div>
                    </div>

                    {/* Config Editor Area */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gray-50/30">
                        {renderEditor()}
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white z-10">
                        <button 
                            onClick={handleReset}
                            disabled={!unsavedConfigs[activePlugin.id] || saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset Changes
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!unsavedConfigs[activePlugin.id] || saving}
                            className={`
                                flex items-center gap-2 px-8 py-2.5 bg-black text-white rounded-xl text-xs font-bold 
                                transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                ${!unsavedConfigs[activePlugin.id] || saving ? '' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                            `}
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {saving ? 'Saving...' : 'Save Config'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                    <Settings className="w-16 h-16 mb-4 opacity-10" />
                    <p className="font-serif text-sm">Select a plugin to configure</p>
                </div>
            )}
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-down z-[110]">
            <CheckIcon className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold">配置已保存</span>
        </div>
      )}
    </div>
  );
};

// Simple Check Icon component since it was missing in imports
const CheckIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export default SettingsModal;
