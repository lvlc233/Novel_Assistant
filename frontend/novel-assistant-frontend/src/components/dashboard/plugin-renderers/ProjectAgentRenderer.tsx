import React from 'react';
import { ListItem } from '@/types/plugin';
import { HistoryItem } from '@/services/projectAgentService';

interface ProjectAgentRendererProps {
  items: ListItem[];
  regionEnabled: Record<string, boolean>;
  expandedId: string | null;
  historyData?: Record<string, HistoryItem[]>;
  onRegionToggle: (id: string) => void;
  onExpand: (id: string) => void;
}

export const ProjectAgentRenderer: React.FC<ProjectAgentRendererProps> = ({
  items,
  regionEnabled,
  expandedId,
  historyData,
  onRegionToggle,
  onExpand
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 items-start">
      {items.map((item) => {
        // Extract metadata safely
        const count = item.metadata?.find(m => m.key === 'count')?.value || '0';
        const tokens = item.metadata?.find(m => m.key === 'tokens')?.value || '0';
        const createTime = item.metadata?.find(m => m.key === 'create_time')?.value || '';
        
        const isExpanded = expandedId === item.id;
        const history = historyData?.[item.id] || [];

        return (
            <div 
            key={item.id}
            className={`group relative bg-white border border-border-primary rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer ${isExpanded ? 'row-span-2' : ''}`}
            onClick={() => onExpand(item.id)}
            style={{ minHeight: '112px' }}
            >
            {/* Left Black Strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-900 z-20" />

            {/* Main Content */}
            <div className="flex-1 pl-5 pr-4 py-3 flex flex-col relative z-10 bg-white">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                <h3 className="text-lg font-serif font-bold text-text-primary tracking-wide">{item.title}</h3>
                
                {/* Updated Toggle Switch (Grey/White/Green) */}
                <div 
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer flex items-center ${regionEnabled[item.id] ? 'bg-green-500' : 'bg-gray-200'}`}
                    onClick={(e) => {
                    e.stopPropagation();
                    onRegionToggle(item.id);
                    }}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${regionEnabled[item.id] ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                </div>

                {/* Dashed Divider */}
                <div className="w-full border-t border-dashed border-border-primary my-3 opacity-50 group-hover:opacity-100 transition-opacity" />

                {/* Footer Stats */}
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <div className="flex items-center gap-4">
                        <span title="对话条数">{count} 条</span>
                        <span title="总消耗 Token">{tokens} Tokens</span>
                    </div>
                    <span className="font-mono opacity-70">{createTime}</span>
                </div>
            </div>

            {/* Accordion History View */}
            <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out bg-gray-50/50 border-t border-border-primary`}
                style={{ 
                    maxHeight: isExpanded ? '400px' : '0px',
                    opacity: isExpanded ? 1 : 0
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside history
            >
                <div className="p-4 space-y-4">
                    <div className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                        历史记录
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                         {history.length > 0 ? (
                             history.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                     <div className={`max-w-[90%] p-2.5 rounded-2xl text-sm ${
                                         msg.role === 'user' 
                                         ? 'bg-accent-primary text-white rounded-tr-sm' 
                                         : 'bg-white border border-border-primary text-text-primary rounded-tl-sm shadow-sm'
                                     }`}>
                                         {msg.content}
                                     </div>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center text-xs text-text-tertiary py-8">
                                 {regionEnabled[item.id] ? '暂无历史记录' : '该区域未启用'}
                             </div>
                         )}
                    </div>
                </div>
            </div>
            </div>
        );
      })}
    </div>
  );
};
