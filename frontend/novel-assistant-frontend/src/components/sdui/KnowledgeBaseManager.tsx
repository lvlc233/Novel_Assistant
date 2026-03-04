import React from 'react';
import { KnowledgeBaseManager as KBManagerImpl } from '@/components/knowledge-base/KnowledgeBaseManager';

export const KnowledgeBaseManager: React.FC = () => {
  return (
    <div className="h-[600px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <KBManagerImpl />
    </div>
  );
};
