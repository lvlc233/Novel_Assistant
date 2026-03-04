import React from 'react';
import { ConfigField } from '@/types/plugin';
import { Info, Edit2, Check, X } from 'lucide-react';

interface ConfigRendererProps {
  fields: ConfigField[];
  configValues: Record<string, any>;
  onConfigChange: (key: string, value: any) => void;
  onSave?: () => void;
  isEditing: boolean;
  onToggleEdit?: () => void;
}

export const ConfigRenderer: React.FC<ConfigRendererProps> = ({ 
  fields, 
  configValues, 
  onConfigChange,
  onSave,
  isEditing,
  onToggleEdit
}) => {
  // Read-Only View
  if (!isEditing) {
    return (
      <div className="h-full flex flex-col relative">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 py-2 border-b border-gray-100">
           <h4 className="text-sm font-bold text-gray-800 font-serif">配置概览</h4>
           {onToggleEdit && (
             <button 
               onClick={onToggleEdit}
               className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
               title="编辑配置"
             >
               <Edit2 className="w-4 h-4" />
             </button>
           )}
        </div>
        
        <div className="space-y-4 overflow-y-auto px-1 pb-4">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1 border-b border-gray-50 pb-3 last:border-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {field.label || field.key}
              </span>
              <div className="text-sm text-gray-800 font-medium break-words">
                {field.valueType === 'boolean' ? (
                  configValues[field.key] ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Disabled
                    </span>
                  )
                ) : field.valueType === 'password' ? (
                  <span className="font-mono text-gray-400">••••••••</span>
                ) : (
                  configValues[field.key] || <span className="text-gray-300 italic">Not Set</span>
                )}
              </div>
              {field.description && (
                <p className="text-[10px] text-gray-400">{field.description}</p>
              )}
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              无配置项
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 py-2 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-800 font-serif">编辑配置</h4>
          {onToggleEdit && (
            <button 
              onClick={onToggleEdit}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="取消编辑"
            >
              <X className="w-4 h-4" />
            </button>
          )}
      </div>

      <div className="space-y-5 overflow-y-auto px-1 pb-20 flex-1">
        {fields.map((field) => (
          <div key={field.key} className="group">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                {field.label || field.key}
                {field.description && (
                  <div className="group/tooltip relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-20 pointer-events-none">
                      {field.description}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-800 rotate-45" />
                    </div>
                  </div>
                )}
              </label>
              
              <div className="relative">
                {field.valueType === 'boolean' ? (
                  <button 
                    onClick={() => onConfigChange(field.key, !configValues[field.key])}
                    className={`
                      relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                      ${configValues[field.key] ? 'bg-black' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        inline-block w-4 h-4 transform bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out mt-0.5 ml-0.5
                        ${configValues[field.key] ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                ) : field.valueType === 'textarea' ? (
                  <textarea
                    value={configValues[field.key] || ''}
                    onChange={(e) => onConfigChange(field.key, e.target.value)}
                    className="w-full min-h-[80px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-gray-200 outline-none transition-all resize-y placeholder-gray-400 font-sans"
                    placeholder={`输入 ${field.label || field.key}...`}
                    readOnly={field.readOnly}
                  />
                ) : (
                  <input
                    type={field.valueType === 'password' ? 'password' : 'text'}
                    value={configValues[field.key] || ''}
                    onChange={(e) => onConfigChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-gray-200 outline-none transition-all placeholder-gray-400 font-sans"
                    placeholder={`输入 ${field.label || field.key}...`}
                    readOnly={field.readOnly} 
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {onSave && (
        <div className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-2 border-t border-gray-100">
          <button 
            onClick={onSave}
            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-all font-medium text-sm shadow-button flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            保存更改
          </button>
        </div>
      )}
    </div>
  );
};
