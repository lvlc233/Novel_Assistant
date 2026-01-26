"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
    ChevronLeft, 
    Plus, 
    Search, 
    Trash2, 
    Save, 
    Database, 
    Tag
} from 'lucide-react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { KnowledgeBaseDetail, KnowledgeBaseChunk } from '@/types/knowledgeBase';
import TiptapEditor from '@/components/editor/TiptapEditor';

export default function KnowledgeBaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [kb, setKb] = useState<KnowledgeBaseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editor State
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editTags, setEditTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await knowledgeBaseService.getKnowledgeBaseDetail(id);
            setKb(data);
            // Select first chunk if none selected and chunks exist
            if (!selectedChunkId && data.chunks.length > 0) {
                const chunk = data.chunks[0];
                setSelectedChunkId(chunk.id);
                setEditTitle(chunk.title);
                setEditContent(chunk.content);
                setEditTags(chunk.tags?.join(', ') || '');
                setIsDirty(false);
            }
        } catch (error) {
            console.error('Failed to fetch knowledge base detail:', error);
            // router.push('/knowledge-bases'); // Optional: redirect on error
        } finally {
            setIsLoading(false);
        }
    }, [id, selectedChunkId]);

    useEffect(() => {
        if (id) {
            fetchDetail();
        }
    }, [id, fetchDetail]);

    const selectChunk = (chunk: KnowledgeBaseChunk) => {
        if (isDirty) {
            if (!confirm('当前修改未保存，确定要切换吗？')) return;
        }
        setSelectedChunkId(chunk.id);
        setEditTitle(chunk.title);
        setEditContent(chunk.content);
        setEditTags(chunk.tags?.join(', ') || '');
        setIsDirty(false);
    };

    const handleCreateChunk = async () => {
        if (!kb) return;
        try {
            const newChunk = await knowledgeBaseService.createChunk(kb.id, {
                title: '新知识点',
                content: '',
                tags: []
            });
            // Update local state
            setKb(prev => prev ? { ...prev, chunks: [newChunk, ...prev.chunks] } : null);
            selectChunk(newChunk);
        } catch (error) {
            console.error('Failed to create chunk:', error);
        }
    };

    const handleSave = async () => {
        if (!kb || !selectedChunkId) return;
        try {
            setIsSaving(true);
            await knowledgeBaseService.updateChunk(kb.id, selectedChunkId, {
                title: editTitle,
                content: editContent,
                tags: editTags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
            });
            
            // Refresh local state without full refetch to keep UI smooth
            setKb(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    chunks: prev.chunks.map(c => 
                        c.id === selectedChunkId 
                            ? { 
                                ...c, 
                                title: editTitle, 
                                content: editContent, 
                                tags: editTags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
                                updated_at: new Date().toISOString()
                            } 
                            : c
                    )
                };
            });
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to save chunk:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteChunk = async (e: React.MouseEvent, chunkId: string) => {
        e.stopPropagation();
        if (!kb) return;
        if (confirm('确定要删除这个知识点吗？')) {
            try {
                await knowledgeBaseService.deleteChunk(kb.id, chunkId);
                setKb(prev => prev ? { ...prev, chunks: prev.chunks.filter(c => c.id !== chunkId) } : null);
                if (selectedChunkId === chunkId) {
                    setSelectedChunkId(null);
                    setEditTitle('');
                    setEditContent('');
                    setEditTags('');
                    setIsDirty(false);
                }
            } catch (error) {
                console.error('Failed to delete chunk:', error);
            }
        }
    };

    const filteredChunks = kb?.chunks.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    if (isLoading && !kb) {
        return (
            <AppLayout>
                <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                </div>
            </AppLayout>
        );
    }

    if (!kb) {
        return (
            <AppLayout>
                <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                    <Database className="w-16 h-16 text-gray-200 mb-4" />
                    <p>未找到知识库</p>
                    <button 
                        onClick={() => router.push('/knowledge-bases')}
                        className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-lg"
                    >
                        返回列表
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="h-full flex overflow-hidden">
                {/* Left Sidebar: List */}
                <div className="w-80 bg-surface-secondary border-r border-border-primary flex flex-col shrink-0">
                    {/* Header */}
                    <div className="p-4 border-b border-border-primary bg-surface-white">
                        <div className="flex items-center gap-2 mb-4">
                            <button 
                                onClick={() => router.push('/knowledge-bases')}
                                className="p-1 hover:bg-surface-hover rounded-full transition-colors text-text-secondary"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="font-bold text-lg text-text-primary truncate" title={kb.name}>
                                {kb.name}
                            </h2>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="搜索知识点..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                            />
                        </div>
                    </div>

                    {/* Chunk List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button
                            onClick={handleCreateChunk}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-primary hover:bg-accent-primary/5 rounded-lg transition-colors font-medium mb-2"
                        >
                            <Plus className="w-4 h-4" />
                            新建知识点
                        </button>

                        {filteredChunks.length === 0 ? (
                            <div className="text-center py-8 text-sm text-text-secondary">
                                无匹配内容
                            </div>
                        ) : (
                            filteredChunks.map(chunk => (
                                <div
                                    key={chunk.id}
                                    onClick={() => selectChunk(chunk)}
                                    className={`
                                        group flex items-start gap-2 px-3 py-3 rounded-lg cursor-pointer transition-colors border border-transparent
                                        ${selectedChunkId === chunk.id 
                                            ? 'bg-white border-border-primary shadow-sm' 
                                            : 'hover:bg-surface-hover'
                                        }
                                    `}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-medium text-sm truncate ${selectedChunkId === chunk.id ? 'text-accent-primary' : 'text-text-primary'}`}>
                                            {chunk.title || '无标题'}
                                        </div>
                                        <div className="text-xs text-text-secondary mt-1 truncate">
                                            {chunk.content?.slice(0, 30) || '无内容...'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteChunk(e, chunk.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Main: Editor */}
                <div className="flex-1 bg-surface-white flex flex-col h-full min-w-0">
                    {selectedChunkId ? (
                        <>
                            {/* Editor Header */}
                            <div className="h-16 border-b border-border-primary px-6 flex items-center justify-between shrink-0">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => {
                                        setEditTitle(e.target.value);
                                        setIsDirty(true);
                                    }}
                                    className="text-xl font-bold text-text-primary bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-300 w-full mr-4"
                                    placeholder="输入标题..."
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-text-secondary mr-2">
                                        {isDirty ? '未保存' : '已保存'}
                                    </span>
                                    <button
                                        onClick={handleSave}
                                        disabled={!isDirty || isSaving}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                            ${isDirty 
                                                ? 'bg-accent-primary text-white hover:bg-accent-primary/90 shadow-sm' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <Save className="w-4 h-4" />
                                        {isSaving ? '保存中...' : '保存'}
                                    </button>
                                </div>
                            </div>

                            {/* Tags Input */}
                            <div className="px-6 py-3 border-b border-border-primary/50 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-text-secondary" />
                                <input
                                    type="text"
                                    value={editTags}
                                    onChange={(e) => {
                                        setEditTags(e.target.value);
                                        setIsDirty(true);
                                    }}
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-text-primary placeholder-gray-400"
                                    placeholder="添加标签（用逗号分隔）..."
                                />
                            </div>

                            {/* Tiptap Editor */}
                            <div className="flex-1 overflow-hidden relative">
                                <div className="absolute inset-0 overflow-y-auto">
                                    <TiptapEditor
                                        content={editContent}
                                        onChange={(html) => {
                                            setEditContent(html);
                                            // Only mark dirty if content actually changed (Tiptap triggers onUpdate often)
                                            // But since we are setting state, it's fine. 
                                            // To avoid loop, we check in TiptapEditor, here we just set dirty.
                                            setIsDirty(true);
                                        }}
                                        editable={true}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-secondary bg-gray-50/50">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <Database className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-lg font-medium text-gray-400">选择或创建一个知识点</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
