import React from 'react';
import { ConfigField } from '@/types/plugin';

interface ConfigRendererProps {
  fields: ConfigField[];
  configValues: Record<string, any>;
  onConfigChange: (key: string, value: any) => void;
  onSave?: () => void;
}

export const ConfigRenderer: React.FC<ConfigRendererProps> = ({ 
  fields, 
  configValues, 
  onConfigChange,
  onSave 
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8">
            <div className="space-y-6">
                {fields.map((field) => (
                    <div key={field.key} className="flex items-center group min-h-[3rem]">
                        {/* Label - Left */}
                        <div className="w-1/3 text-right pr-8">
                            <label className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                {field.label || field.key}
                            </label>
                        </div>
                        
                        {/* Input - Right */}
                        <div className="w-2/3 pl-8 border-l border-border-primary relative py-1">
                            <div className="absolute left-0 top-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-border-primary group-hover:bg-accent-primary transition-colors ring-4 ring-white z-10" />
                            
                            {field.valueType === 'boolean' ? (
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => onConfigChange(field.key, !configValues[field.key])}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${configValues[field.key] ? 'bg-accent-primary' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${configValues[field.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-xs text-text-tertiary">
                                        {configValues[field.key] ? '已开启' : '已关闭'}
                                    </span>
                                </div>
                            ) : field.valueType === 'textarea' ? (
                                <textarea
                                    value={configValues[field.key] || ''}
                                    onChange={(e) => onConfigChange(field.key, e.target.value)}
                                    className="w-full bg-transparent border-b border-border-primary py-2 text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder-text-tertiary/50 min-h-[80px] resize-y"
                                    placeholder={`设置 ${field.label || field.key}...`}
                                    readOnly={field.readOnly}
                                />
                            ) : (
                                <input
                                    type={field.valueType === 'password' ? 'password' : 'text'}
                                    value={configValues[field.key] || ''}
                                    onChange={(e) => onConfigChange(field.key, e.target.value)}
                                    className="w-full bg-transparent border-b border-border-primary py-2 text-text-primary focus:outline-none focus:border-accent-primary transition-colors placeholder-text-tertiary/50"
                                    placeholder={`设置 ${field.label || field.key}...`}
                                    readOnly={field.readOnly} 
                                />
                            )}
                            
                            {field.description && (
                                <p className="mt-1 text-xs text-text-tertiary">{field.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {onSave && (
                <div className="flex justify-center pt-8">
                    <button 
                        onClick={onSave}
                        className="px-8 py-2.5 bg-accent-primary text-white rounded-full hover:bg-accent-hover hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium"
                    >
                        保存配置
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};
