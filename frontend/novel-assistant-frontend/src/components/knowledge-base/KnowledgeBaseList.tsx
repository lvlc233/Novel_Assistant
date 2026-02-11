import React from 'react';
import { Database, Plus, Trash2 } from 'lucide-react';
import { KnowledgeBaseMeta } from '@/types/knowledgeBase';

interface KnowledgeBaseListProps {
    kbs: KnowledgeBaseMeta[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCreateClick: () => void;
    onDelete?: (id: string) => void;
}

export const KnowledgeBaseList: React.FC<KnowledgeBaseListProps> = ({
    kbs,
    selectedId,
    onSelect,
    onCreateClick,
    onDelete
}) => {
    return (
        <div className="flex flex-col h-full bg-gray-50 border-r border-border-primary w-64 flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-border-primary bg-white flex flex-col gap-3">
                <div className="flex items-center gap-2 text-text-primary font-bold">
                    <Database className="w-5 h-5 text-accent-primary" />
                    <span>知识库列表</span>
                </div>
                <button 
                    onClick={onCreateClick}
                    className="w-full py-2 px-3 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                    title="新建知识库"
                >
                    <Plus className="w-4 h-4" />
                    新建知识库
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50">
                {kbs.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary text-sm">
                        暂无知识库
                    </div>
                ) : (
                    kbs.map((kb) => (
                        <div
                            key={kb.id}
                            onClick={() => onSelect(kb.id)}
                            className={`
                                group w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all
                                flex items-center gap-2 cursor-pointer border
                                ${selectedId === kb.id 
                                    ? 'bg-white border-accent-primary text-accent-primary font-medium shadow-sm' 
                                    : 'border-transparent text-text-secondary hover:bg-white hover:border-border-primary hover:text-text-primary'
                                }
                            `}
                        >
                            <span className="truncate flex-1">{kb.title}</span>
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(kb.id);
                                    }}
                                    className="p-1 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    title="删除知识库"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
