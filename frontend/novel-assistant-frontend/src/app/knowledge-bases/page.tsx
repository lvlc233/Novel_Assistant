"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Database, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { KnowledgeBaseMeta, CreateKnowledgeBaseRequest } from '@/types/knowledgeBase';
import { CreateKnowledgeBaseModal } from '@/components/knowledge-base/CreateKnowledgeBaseModal';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function KnowledgeBaseListPage() {
    const router = useRouter();
    const [kbs, setKbs] = useState<KnowledgeBaseMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchKBs = async () => {
        try {
            setIsLoading(true);
            const data = await knowledgeBaseService.getKnowledgeBases();
            setKbs(data);
        } catch (error) {
            console.error('Failed to fetch knowledge bases:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKBs();
    }, []);

    const handleCreate = async (data: CreateKnowledgeBaseRequest) => {
        await knowledgeBaseService.createKnowledgeBase(data);
        await fetchKBs();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('确定要删除这个知识库吗？')) {
            await knowledgeBaseService.deleteKnowledgeBase(id);
            await fetchKBs();
        }
    };

    const filteredKBs = kbs.filter(kb => 
        kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AppLayout>
            <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-text-primary flex items-center gap-3">
                            <Database className="w-8 h-8 text-accent-primary" />
                            知识库管理
                        </h1>
                        <p className="text-text-secondary mt-1">
                            管理你的世界观设定、人物传记和其他参考资料
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        新建知识库
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="搜索知识库名称或标签..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 bg-surface-white shadow-sm"
                    />
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredKBs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredKBs.map(kb => (
                            <div
                                key={kb.id}
                                onClick={() => router.push(`/knowledge-bases/${kb.id}`)}
                                className="group relative bg-surface-white rounded-xl border border-border-primary p-5 hover:shadow-lg hover:border-accent-primary/50 transition-all cursor-pointer flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                                        {kb.name}
                                    </h3>
                                    <button 
                                        onClick={(e) => handleDelete(e, kb.id)}
                                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="删除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <p className="text-text-secondary text-sm line-clamp-2 mb-4 flex-1">
                                    {kb.description || '暂无描述'}
                                </p>

                                <div className="flex items-center justify-between text-xs text-text-secondary pt-4 border-t border-border-primary/50">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {kb.tags && kb.tags.length > 0 ? (
                                            kb.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-surface-secondary rounded-full">
                                                    <Tag className="w-3 h-3" /> {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="italic text-gray-400">无标签</span>
                                        )}
                                    </div>
                                    <span>
                                        {kb.updated_at ? formatDistanceToNow(new Date(kb.updated_at), { addSuffix: true, locale: zhCN }) : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
                        <Database className="w-16 h-16 text-gray-200 mb-4" />
                        <p className="text-lg font-medium">还没有知识库</p>
                        <p className="text-sm mb-6">创建一个新的知识库来管理你的设定资料</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                        >
                            立即创建
                        </button>
                    </div>
                )}
            </div>

            <CreateKnowledgeBaseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
            />
        </AppLayout>
    );
}
