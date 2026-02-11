import React, { useState, useEffect } from 'react';
import { KnowledgeBaseList } from './KnowledgeBaseList';
import { KnowledgeBaseDetail } from './KnowledgeBaseDetail';
import { KnowledgeBaseForm } from './KnowledgeBaseForm';
import { ChunkForm } from './ChunkForm';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { KnowledgeBaseMeta, KnowledgeBaseChunk } from '@/types/knowledgeBase';
import { Database, ArrowLeft } from 'lucide-react';

type ViewMode = 'empty' | 'create_kb' | 'detail' | 'create_chunk' | 'chunk_detail';

export const KnowledgeBaseManager: React.FC = () => {
    const [kbs, setKbs] = useState<KnowledgeBaseMeta[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedChunk, setSelectedChunk] = useState<KnowledgeBaseChunk | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('empty');

    const fetchKbs = async () => {
        try {
            const data = await knowledgeBaseService.getKnowledgeBases();
            setKbs(data);
        } catch (error) {
            console.error('Failed to fetch knowledge bases:', error);
        }
    };

    useEffect(() => {
        fetchKbs();
    }, []);

    const handleSelectKb = (id: string) => {
        setSelectedId(id);
        setViewMode('detail');
    };

    const handleCreateKbClick = () => {
        setSelectedId(null); // Optional: deselect current
        setViewMode('create_kb');
    };

    const handleCreateKbSuccess = () => {
        fetchKbs();
        // Optionally select the new one if we returned it, but for now just go back to empty or select first
        setViewMode('empty'); 
    };

    const handleCreateChunkClick = () => {
        setViewMode('create_chunk');
    };

    const handleCreateChunkSuccess = () => {
        setViewMode('detail');
        // Detail component will re-fetch because of key or effect
    };

    const handleSelectChunk = (chunk: KnowledgeBaseChunk) => {
        setSelectedChunk(chunk);
        setViewMode('chunk_detail');
    };

    const handleDeleteKb = async (id: string) => {
        if (!confirm('确定要删除这个知识库吗？')) return;
        try {
            await knowledgeBaseService.deleteKnowledgeBase(id);
            setKbs(kbs.filter(kb => kb.id !== id));
            if (selectedId === id) {
                setSelectedId(null);
                setViewMode('empty');
            }
        } catch (error) {
            console.error('Failed to delete knowledge base:', error);
        }
    };

    return (
        <div className="flex h-full w-full bg-white rounded-xl overflow-hidden shadow-sm border border-border-primary">
            {/* Left Sidebar */}
            <KnowledgeBaseList 
                kbs={kbs} 
                selectedId={selectedId} 
                onSelect={handleSelectKb}
                onCreateClick={handleCreateKbClick}
                onDelete={handleDeleteKb}
            />

            {/* Right Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
                {viewMode === 'empty' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary">
                        <Database className="w-16 h-16 opacity-10 mb-4" />
                        <p>请选择或创建一个知识库</p>
                    </div>
                )}

                {viewMode === 'create_kb' && (
                    <KnowledgeBaseForm 
                        onSuccess={handleCreateKbSuccess}
                        onCancel={() => setViewMode(selectedId ? 'detail' : 'empty')}
                    />
                )}

                {viewMode === 'detail' && selectedId && (
                    <KnowledgeBaseDetail 
                        kbId={selectedId}
                        onCreateChunkClick={handleCreateChunkClick}
                        onSelectChunk={handleSelectChunk}
                    />
                )}

                {viewMode === 'chunk_detail' && selectedChunk && (
                    <div className="flex-1 h-full flex flex-col bg-white p-6 relative overflow-hidden">
                        {/* Header with Back button */}
                        <div className="flex items-center gap-4 mb-6">
                            <button 
                                onClick={() => setViewMode('detail')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-text-secondary" />
                            </button>
                            <h2 className="text-lg font-semibold text-text-primary">知识点详情</h2>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="bg-gray-50 rounded-xl p-6 border border-border-primary">
                                <p className="whitespace-pre-wrap leading-relaxed text-text-primary">
                                    {selectedChunk.context}
                                </p>
                            </div>
                            
                            {/* Tags */}
                            {selectedChunk.search_keys && selectedChunk.search_keys.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedChunk.search_keys.map((tag, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-gray-100 text-text-secondary text-xs rounded-md border border-gray-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {viewMode === 'create_chunk' && selectedId && (
                    <ChunkForm 
                        kbId={selectedId}
                        onSuccess={handleCreateChunkSuccess}
                        onCancel={() => setViewMode('detail')}
                    />
                )}
            </div>
        </div>
    );
};
