import React, { useState, useEffect } from 'react';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { getWorkList } from '@/services/workService';
import { CreateKnowledgeBaseRequest } from '@/types/knowledgeBase';
import { Work } from '@/types/work';
import { Loader2, Save } from 'lucide-react';

interface KnowledgeBaseFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const KnowledgeBaseForm: React.FC<KnowledgeBaseFormProps> = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [works, setWorks] = useState<Work[]>([]);
    const [loadingWorks, setLoadingWorks] = useState(false);

    const [formData, setFormData] = useState<CreateKnowledgeBaseRequest>({
        name: '',
        description: '',
        work_id: ''
    });

    useEffect(() => {
        const fetchWorks = async () => {
            setLoadingWorks(true);
            try {
                const data = await getWorkList(userId);
                setWorks(data);
            } catch (error) {
                console.error('Failed to fetch works:', error);
            } finally {
                setLoadingWorks(false);
            }
        };
        fetchWorks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.work_id) return;

        try {
            setLoading(true);
            await knowledgeBaseService.createKnowledgeBase(formData);
            onSuccess();
        } catch (error) {
            console.error('Failed to create knowledge base:', error);
            // In a real app, use toast here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-white">
            <div className="w-full max-w-lg">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-2">新建知识库</h2>
                    <p className="text-text-secondary">创建一个新的知识库来管理您的设定与资料</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-border-primary focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all outline-none"
                            placeholder="例如：世界观设定"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            关联作品 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.work_id || ''}
                            onChange={e => setFormData({ ...formData, work_id: e.target.value })}
                            disabled={loadingWorks}
                            className="w-full px-4 py-2 rounded-lg border border-border-primary focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all outline-none bg-white"
                        >
                            <option value="" disabled>
                                {loadingWorks ? '加载中...' : '请选择关联作品'}
                            </option>
                            {works.map((work) => (
                                <option key={work.id} value={work.id}>
                                    {work.title}
                                </option>
                            ))}
                        </select>
                        {works.length === 0 && !loadingWorks && (
                            <p className="text-xs text-red-500 mt-1">
                                暂无作品，请先去创建作品。
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            描述
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-border-primary focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all outline-none min-h-[120px]"
                            placeholder="简要描述该知识库的用途..."
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 py-2.5 border border-border-primary text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim() || !formData.work_id}
                            className="flex-1 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            创建知识库
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
