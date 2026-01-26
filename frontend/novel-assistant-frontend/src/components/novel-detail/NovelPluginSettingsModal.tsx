"use client";
import React, { useState, useEffect } from 'react';
import { X, Puzzle, Save } from 'lucide-react';
import { PluginInstance } from '@/types/plugin';
import { getPlugins } from '@/services/pluginService';

interface NovelPluginSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
}

export default function NovelPluginSettingsModal({ isOpen, onClose, novelId }: NovelPluginSettingsModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _novelId = novelId;
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [enabledPlugins, setEnabledPlugins] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
        // Load global plugins
        getPlugins().then(setPlugins);
        // TODO: Load novel specific configuration
        // For now, assume all global enabled plugins are enabled here
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePlugin = (id: string) => {
      const newSet = new Set(enabledPlugins);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setEnabledPlugins(newSet);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-accent-primary" />
              作品插件配置
          </h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
           <p className="text-sm text-text-secondary">
              选择要在当前作品中启用的插件。系统插件默认启用。
           </p>
           
           {plugins.map(plugin => (
               <div key={plugin.id} className="flex items-center justify-between p-3 rounded-lg border border-border-primary hover:bg-surface-secondary transition-colors">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                           <Puzzle className="w-4 h-4" />
                       </div>
                       <div>
                           <div className="font-medium text-sm text-text-primary">{plugin.manifest.name}</div>
                           <div className="text-xs text-text-secondary">{plugin.manifest.description}</div>
                       </div>
                   </div>
                   
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={plugin.manifest.type === 'system' || enabledPlugins.has(plugin.id)}
                        disabled={plugin.manifest.type === 'system'}
                        onChange={() => togglePlugin(plugin.id)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary"></div>
                   </label>
               </div>
           ))}
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3">
          <button 
             onClick={onClose}
             className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
          >
             取消
          </button>
          <button 
             onClick={onClose}
             className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
          >
             <Save className="w-4 h-4" />
             保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
