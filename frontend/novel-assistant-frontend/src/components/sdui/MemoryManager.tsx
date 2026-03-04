import React from 'react';
import { Brain, Plus } from 'lucide-react';

interface Memory {
  id: string;
  content: string;
  created_at?: string;
}

interface MemoryManagerProps {
  memories?: Memory[];
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({ memories = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Brain className="w-5 h-5 text-gray-500" />
            Memory Manager
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Add New
          </button>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px] max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
        {memories.length === 0 ? (
           <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 h-full flex flex-col justify-center items-center">
            <p className="text-gray-500 text-sm">No memories stored yet.</p>
          </div>
        ) : (
          memories.map((mem) => (
            <div key={mem.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm text-gray-800 line-clamp-3 leading-relaxed">{mem.content}</div>
              {mem.created_at && <div className="text-xs text-gray-400 mt-2 text-right">{mem.created_at}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
