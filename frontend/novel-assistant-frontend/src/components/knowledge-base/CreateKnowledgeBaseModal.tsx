import React, { useState } from 'react';
import { X, Database } from 'lucide-react';
import { CreateKnowledgeBaseRequest } from '@/types/knowledgeBase';

interface CreateKnowledgeBaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateKnowledgeBaseRequest) => Promise<void>;
}

export const CreateKnowledgeBaseModal: React.FC<CreateKnowledgeBaseModalProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setIsSubmitting(true);
            await onSubmit({
                name,
                description,
                tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
            });
            onClose();
            // Reset form
            setName('');
            setDescription('');
            setTags('');
        } catch (error) {
            console.error('Failed to create knowledge base:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-surface-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
                <div className="px-6 py-4 border-b border-border-primary flex justify-between items-center bg-surface-secondary/50">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-accent-primary" />
                        <h3 className="font-bold text-lg text-text-primary">创建知识库</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded-full transition-colors">
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                            placeholder="例如：魔法设定集"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">描述</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 h-24 resize-none"
                            placeholder="简要描述知识库的内容..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">标签</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                            placeholder="用逗号分隔，例如：设定, 魔法"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? '创建中...' : '创建'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
