import React from 'react';
import { BookOpen, Settings } from 'lucide-react';

interface WorkType {
  id: string;
  name: string;
  description?: string;
}

interface WorkTypeSettingsProps {
  workTypes?: WorkType[];
}

export const WorkTypeSettings: React.FC<WorkTypeSettingsProps> = ({ workTypes = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-500" />
            Work Types
        </h3>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        {workTypes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No work types configured.</p>
          </div>
        ) : (
          workTypes.map((type) => (
            <div key={type.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-900">{type.name}</div>
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{type.id}</span>
              </div>
              {type.description && <div className="text-sm text-gray-500 mt-1 line-clamp-2">{type.description}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
