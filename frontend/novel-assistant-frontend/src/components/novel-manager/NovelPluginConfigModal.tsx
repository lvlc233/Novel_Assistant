import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Puzzle, Settings, Info, Save, Loader2 } from 'lucide-react';
import { Novel } from '@/types/novel';
import { PluginInstance } from '@/types/plugin';
import { getPlugins } from '@/services/pluginService';

interface NovelPluginConfigModalProps {
  novel: Novel;
  onClose: () => void;
  onSave: (plugins: { id: string; enabled: boolean; config: Record<string, unknown> }[]) => Promise<void>;
}

const MOCK_MODELS = ["GPT-4", "Claude 3.5 Sonnet", "Gemini Pro", "DeepSeek V3"];

export const NovelPluginConfigModal: React.FC<NovelPluginConfigModalProps> = ({ 
  novel, 
  onClose, 
  onSave 
}) => {
  const [availablePlugins, setAvailablePlugins] = useState<PluginInstance[]>([]);
  const [selectedPlugins, setSelectedPlugins] = useState<Set<string>>(new Set());
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, any>>({});
  const [activePluginId, setActivePluginId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load plugins
    getPlugins().then(plugins => {
      setAvailablePlugins(plugins);
      
      // Initialize from novel data
      const initialSelected = new Set<string>();
      const initialConfigs: Record<string, Record<string, unknown>> = {};

      // Default configs from plugins
      plugins.forEach(p => {
        initialConfigs[p.id] = { model: "GPT-4", ...p.config };
      });

      // Override with novel's saved plugins
      if (novel.plugins) {
        novel.plugins.forEach(p => {
          if (p.enabled) {
            initialSelected.add(p.id);
          }
          if (p.config) {
            initialConfigs[p.id] = { ...initialConfigs[p.id], ...p.config };
          }
        });
      }

      setSelectedPlugins(initialSelected);
      setPluginConfigs(initialConfigs);
      
      if (plugins.length > 0) {
        setActivePluginId(plugins[0].id);
      }
    });

    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [novel]);

  const togglePlugin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(selectedPlugins);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPlugins(newSet);
  };

  const updatePluginConfig = (pluginId: string, key: string, value: unknown) => {
    setPluginConfigs(prev => ({
      ...prev,
      [pluginId]: {
        ...prev[pluginId],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const pluginsData = availablePlugins.map(p => ({
        id: p.id,
        enabled: selectedPlugins.has(p.id),
        config: pluginConfigs[p.id] || {}
      }));
      await onSave(pluginsData);
      onClose();
    } catch (error) {
      console.error('Failed to save plugin config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className="relative z-10 w-[900px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-900">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">插件配置</h2>
              <p className="text-xs text-gray-500">为《{novel.title}》配置 AI 助手与工具</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Sidebar - Plugin List */}
          <div className="w-[280px] border-r border-gray-100 flex flex-col bg-gray-50/50 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {availablePlugins.map(plugin => {
              const isSelected = selectedPlugins.has(plugin.id);
              const isActive = activePluginId === plugin.id;
              return (
                <div 
                  key={plugin.id}
                  onClick={() => setActivePluginId(plugin.id)}
                  className={`
                    p-3 rounded-xl border cursor-pointer transition-all relative group
                    ${isActive ? 'border-gray-900 bg-white shadow-md' : 'border-transparent hover:bg-white hover:border-gray-100'}
                  `}
                >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}
                      `}>
                        <Puzzle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`font-bold text-sm truncate ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                              {plugin.manifest.name}
                            </span>
                            <div 
                              onClick={(e) => togglePlugin(plugin.id, e)}
                              className={`
                                w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors
                                ${isSelected ? 'bg-green-500' : 'bg-gray-300'}
                              `}
                            >
                              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isSelected ? 'translate-x-4' : ''}`} />
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                            {plugin.manifest.description}
                          </p>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>

          {/* Main Panel - Config */}
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            {activePluginId ? (
              <div className="max-w-xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-1">
                        {availablePlugins.find(p => p.id === activePluginId)?.manifest.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${selectedPlugins.has(activePluginId) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedPlugins.has(activePluginId) ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {selectedPlugins.has(activePluginId) ? '已启用' : '未启用'}
                      </span>
                    </div>
                  </div>

                  {!selectedPlugins.has(activePluginId) ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                          <Settings className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-gray-900 font-bold mb-2">插件未启用</h4>
                        <p className="text-gray-500 text-sm font-medium max-w-xs mx-auto mb-6">
                          启用此插件以配置模型参数、自动化选项和其他高级功能
                        </p>
                        <button 
                          onClick={() => togglePlugin(activePluginId)}
                          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-black/20"
                        >
                          立即启用
                        </button>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-fade-in">
                        <div className="p-5 bg-blue-50 rounded-2xl flex gap-4 border border-blue-100">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                            <Info className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-blue-700 font-bold">功能说明</p>
                            <p className="text-sm text-blue-600/80 leading-relaxed">
                              {availablePlugins.find(p => p.id === activePluginId)?.manifest.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">核心配置</label>
                              
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                                <div>
                                  <label className="text-sm font-bold text-gray-900 mb-2 block">AI 模型</label>
                                  <select 
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                    value={pluginConfigs[activePluginId]?.model || "GPT-4"}
                                    onChange={(e) => updatePluginConfig(activePluginId, 'model', e.target.value)}
                                  >
                                    {MOCK_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <p className="text-xs text-gray-500 mt-2">选择用于此插件的基础大语言模型</p>
                                </div>
                              </div>
                          </div>

                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">自动化选项</label>
                              <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-gray-100 hover:border-gray-400 rounded-xl transition-all group">
                                  <div className="relative flex items-center">
                                    <input 
                                      type="checkbox" 
                                      className="peer sr-only"
                                      checked={pluginConfigs[activePluginId]?.autoSave ?? true}
                                      onChange={(e) => updatePluginConfig(activePluginId, 'autoSave', e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-gray-900 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-sm font-bold text-gray-900 block group-hover:text-black transition-colors">自动保存生成内容</span>
                                    <span className="text-xs text-gray-500">生成完成后自动保存到草稿箱</span>
                                  </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-gray-100 hover:border-gray-400 rounded-xl transition-all group">
                                  <div className="relative flex items-center">
                                    <input 
                                      type="checkbox" 
                                      className="peer sr-only"
                                      checked={pluginConfigs[activePluginId]?.notifications ?? false}
                                      onChange={(e) => updatePluginConfig(activePluginId, 'notifications', e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-gray-900 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-sm font-bold text-gray-900 block group-hover:text-black transition-colors">启用桌面通知</span>
                                    <span className="text-xs text-gray-500">任务完成时发送浏览器通知</span>
                                  </div>
                                </label>
                              </div>
                          </div>
                        </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Puzzle className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-sm font-medium">请从左侧选择一个插件进行配置</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-gray-100 bg-gray-50 px-8 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            上次修改: {novel.updatedAt}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-black/20 flex items-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NovelPluginConfigModal;
