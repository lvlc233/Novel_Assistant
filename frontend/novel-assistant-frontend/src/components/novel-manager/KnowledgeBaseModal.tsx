import React, { useState } from 'react';
import { X, Book, Plus, ExternalLink } from 'lucide-react';
import { Novel, KnowledgeBase } from '@/types/novel';

interface KnowledgeBaseModalProps {
  novel: Novel;
  onClose: () => void;
}

const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ novel, onClose }) => {
  // Mock data for associated knowledge bases
  const [associatedKbs] = useState<KnowledgeBase[]>([
    {
      id: 'kb-1',
      name: '世界观设定集',
  
      tags: ['设定', '世界观'],

    },
    {
      id: 'kb-2',
      name: '人物小传',

      tags: ['角色', '传记'],

    }
  ]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="
        relative w-full max-w-lg bg-surface-white rounded-2xl shadow-2xl overflow-hidden 
        transform transition-all animate-slide-up
        flex flex-col max-h-[80vh]
      ">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-light text-success flex items-center justify-center">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-text-primary">关联知识库</h3>
              <p className="text-xs text-text-secondary">
                当前小说: {novel.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-primary">
          <div className="space-y-3">
            {associatedKbs.length > 0 ? (
              associatedKbs.map((kb) => (
                <div 
                  key={kb.id}
                  onClick={() => {}}
                  className="
                    group bg-surface-white p-4 rounded-xl border border-border-primary shadow-sm 
                    hover:border-success-light hover:shadow-md transition-all cursor-pointer
                    relative overflow-hidden
                  "
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4 text-success" />
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1 min-w-[2rem]">
                      <span className="text-2xl">📁</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary group-hover:text-success transition-colors">
                        {kb.name}
                      </h4>
                      {/* <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                        {kb.description}
                      </p> */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {kb.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Book className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>暂无关联知识库</p>
              </div>
            )}
            
            {/* Add New Button Placeholder */}
            <button className="
              w-full py-3 border-2 border-dashed border-gray-200 rounded-xl
              text-gray-400 hover:text-success hover:border-success-light hover:bg-success-light
              flex items-center justify-center gap-2 transition-all group
            ">
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>关联新知识库</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-center text-gray-400">
          点击知识库卡片可查看详情
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;
