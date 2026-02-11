import React, { useState } from 'react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { CreateKnowledgeBaseChunkRequest } from '@/types/knowledgeBase';
import { Loader2, Save } from 'lucide-react';

interface ChunkFormProps {
    kbId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const ChunkForm: React.FC<ChunkFormProps> = ({ kbId, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateKnowledgeBaseChunkRequest>({
        chunk_id: crypto.randomUUID(),
        context: '',
        search_keys: []
    });
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.search_keys?.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    search_keys: [...(prev.search_keys || []), tagInput.trim()]
                }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            search_keys: prev.search_keys?.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.context.trim()) return;

        try {
            setLoading(true);
            await knowledgeBaseService.createChunk(kbId, formData);
            onSuccess();
        } catch (error) {
            console.error('Failed to create chunk:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 h-full flex flex-col p-6 bg-white overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-primary mb-1">新建知识点</h2>
                    <p className="text-sm text-text-secondary">添加具体的知识条目到知识库中</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            内容 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.context}
                            onChange={e => setFormData({ ...formData, context: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-border-primary focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all outline-none min-h-[200px] resize-y font-mono text-sm"
                            placeholder="输入知识点内容..."
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            关键词 (回车添加)
                        </label>
                        <div className="flex flex-wrap gap-2 p-2 border border-border-primary rounded-lg bg-white focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary transition-all">
                            {formData.search_keys?.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-accent-secondary/10 text-accent-secondary text-xs rounded-md flex items-center gap-1">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-accent-primary"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="flex-1 min-w-[100px] outline-none text-sm py-1"
                                placeholder={formData.search_keys?.length ? "" : "输入关键词..."}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-border-primary">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="px-6 py-2.5 border border-border-primary text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.context.trim()}
                            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 ml-auto"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            保存知识点
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
