import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { PluginDetailsInfo } from './PluginDetailsInfo';

interface AgentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  loading: boolean;
  pluginId: string;
}

export const AgentManagerModal: React.FC<AgentManagerModalProps> = ({ isOpen, onClose, data, loading, pluginId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="w-[800px] max-w-[90vw] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Agent 管理器</h2>
            <p className="text-xs text-text-secondary">配置 Agent 邮件通知与查看状态</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative p-6 bg-gray-50/50">
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">加载中...</span>
                    </div>
                </div>
            ) : (
                data && <PluginDetailsInfo data={data.data} pluginId={pluginId} />
            )}
        </div>
      </div>
    </div>
  );
};
