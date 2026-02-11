import React, { useEffect, useState } from 'react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { KnowledgeBaseChunk } from '@/types/knowledgeBase';
import { Loader2, Plus, Trash2, Edit2, Tag, Database } from 'lucide-react';

interface KnowledgeBaseDetailProps {
    kbId: string;
    onCreateChunkClick: () => void;
    onSelectChunk: (chunk: KnowledgeBaseChunk) => void;
}

export const KnowledgeBaseDetail: React.FC<KnowledgeBaseDetailProps> = ({ kbId, onCreateChunkClick, onSelectChunk }) => {
    const [chunks, setChunks] = useState<KnowledgeBaseChunk[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchChunks = async () => {
        try {
            setLoading(true);
            const data = await knowledgeBaseService.getKnowledgeBaseChunks(kbId);
            setChunks(data);
        } catch (error) {
            console.error('Failed to fetch chunks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (kbId) {
            fetchChunks();
        }
    }, [kbId]);

    const handleDelete = async (chunkId: string) => {
        if (!confirm('确定要删除这个知识点吗？')) return;
        try {
            await knowledgeBaseService.deleteChunk(kbId, chunkId);
            setChunks(chunks.filter(c => c.chunk_id !== chunkId));
        } catch (error) {
            console.error('Failed to delete chunk:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col relative bg-gray-50">
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {chunks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                        <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
                            <Database className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="mb-4">该知识库暂无内容</p>
                        <button
                            onClick={onCreateChunkClick}
                            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            创建第一个知识点
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {chunks.map((chunk) => (
                            <div 
                                key={chunk.chunk_id}
                                onClick={() => onSelectChunk(chunk)}
                                className="group bg-white p-4 rounded-xl border border-border-primary hover:shadow-lg hover:border-accent-primary transition-all flex flex-col cursor-pointer"
                            >
                                <div className="flex-1 mb-3">
                                    <p className="text-text-primary text-sm line-clamp-4 whitespace-pre-wrap leading-relaxed">
                                        {chunk.context}
                                    </p>
                                </div>
                                
                                <div className="mt-auto pt-3 border-t border-border-primary flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {chunk.search_keys && chunk.search_keys.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {chunk.search_keys.slice(0, 2).map((tag, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-text-secondary text-[10px] rounded-md truncate max-w-[60px] border border-gray-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {chunk.search_keys.length > 2 && (
                                                    <span className="text-[10px] text-text-tertiary">+{chunk.search_keys.length - 2}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> 无标签
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* TODO: Implement Edit */}
                                        {/* <button className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-surface-hover rounded-md">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button> */}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(chunk.chunk_id);
                                            }}
                                            className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            {chunks.length > 0 && (
                <div className="absolute bottom-6 right-6">
                    <button
                        onClick={onCreateChunkClick}
                        className="h-12 px-6 bg-accent-primary text-white rounded-full shadow-lg shadow-accent-primary/30 hover:shadow-xl hover:scale-105 hover:bg-accent-hover transition-all flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        新建知识点
                    </button>
                </div>
            )}
        </div>
    );
};
