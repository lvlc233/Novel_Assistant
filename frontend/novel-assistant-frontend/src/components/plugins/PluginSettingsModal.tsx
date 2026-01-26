"use client";
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { PluginInstance } from '@/types/plugin';

interface PluginSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin: PluginInstance;
  onSave: (config: Record<string, unknown>) => void;
}

export default function PluginSettingsModal({ isOpen, onClose, plugin, onSave }: PluginSettingsModalProps) {
  const [configJson, setConfigJson] = useState(JSON.stringify(plugin.config, null, 2));
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const config = JSON.parse(configJson);
      onSave(config);
      onClose();
    } catch {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h3 className="font-bold text-lg text-text-primary">配置: {plugin.manifest.name}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
           <p className="text-sm text-text-secondary mb-4">
              直接编辑 JSON 配置 (暂时代替 Schema Form)
           </p>
           <textarea
             className="w-full h-64 font-mono text-sm p-3 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-surface-secondary"
             value={configJson}
             onChange={(e) => {
                 setConfigJson(e.target.value);
                 setError(null);
             }}
           />
           {error && <p className="text-error text-xs mt-2">{error}</p>}
        </div>

        <div className="p-4 border-t border-border-primary flex justify-end gap-3">
          <button 
             onClick={onClose}
             className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
          >
             取消
          </button>
          <button 
             onClick={handleSave}
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
