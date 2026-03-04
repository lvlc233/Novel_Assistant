"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { X, Database, Settings } from 'lucide-react';
import { PluginConfig, PluginInstance, ConfigField } from '@/types/plugin';
import { getPluginDetail, invokePlugin } from '@/services/pluginService';
import { SDUIRenderer } from '@/components/common/SDUIRenderer';
import { ConfigRenderer } from '@/components/dashboard/plugin-renderers/ConfigRenderer';

// --- Components ---

const DataSkeleton = () => (
  <div className="space-y-4 w-full">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex flex-col gap-2 p-4 border border-gray-100 rounded-xl bg-white">
        <div className="w-1/4 h-4 bg-gray-100 rounded animate-pulse" />
        <div className="w-full h-20 bg-gray-50 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

// --- Main Component ---

interface PluginSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin: PluginInstance;
  onSave: (config: PluginConfig) => void;
}

export default function PluginSettingsModal({ isOpen, onClose, plugin, onSave }: PluginSettingsModalProps) {
  console.log('PluginSettingsModal: Received plugin:', plugin);
  const [configValues, setConfigValues] = useState<Record<string, any>>(plugin.config || {});
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  
  // Convert configSchema to ConfigField[] for ConfigRenderer
  const configFields: ConfigField[] = useMemo(() => {
    console.log('PluginSettingsModal: configSchema source:', plugin.configSchema, (plugin as any).config_schema);
    const schema = plugin.configSchema || (plugin as any).config_schema;
    if (!schema) return [];
    const fields = Object.entries(schema).map(([key, schema]: [string, any]) => ({
        key,
        label: schema.title || key,
        description: schema.description,
        valueType: schema.type === 'boolean' ? 'boolean' : 
                   key.includes('password') || key.includes('secret') || key.includes('key') ? 'password' : 
                   (schema.type === 'string' && (schema.maxLength > 100 || key.includes('prompt') || key.includes('description'))) ? 'textarea' : 'text',
        readOnly: false,
        children: []
    }));
    console.log('PluginSettingsModal: Computed fields:', fields);
    return fields;
  }, [plugin.configSchema, (plugin as any).config_schema]);

  const [data, setData] = useState<any | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [uiTarget, setUiTarget] = useState<string | null>(null);

  useEffect(() => {
    setConfigValues(plugin.config || {});
    setIsEditingConfig(false);
  }, [plugin.id, plugin.config]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoadingData(true);
    setDataError(null);
    setUiTarget(null);

    const isAgentManager = plugin.manifest?.name === 'agent_manager'
      || plugin.manifest?.name?.includes('Agent管理')
      || plugin.id === 'agent_manager';

    const isProjectHelper = plugin.name === 'project_helper';
    const isDocumentHelper = plugin.name === 'document_helper';
      
    // Determine UI Target from operation if applicable
    if (isAgentManager) {
        const op = plugin.operations?.find(o => o.name === 'list_agent_plugins');
        if (op?.ui_target) {
            setUiTarget(op.ui_target);
        } else {
            setUiTarget('AgentBox'); 
        }
    } 
    
    // Simplified data fetching logic for now
    const fetchData = isAgentManager
      ? invokePlugin(plugin.id, 'get_agent_info_in_card', new Map())
      : isProjectHelper 
        ? invokePlugin(plugin.id, 'get_project_sessions', new Map())
        : isDocumentHelper
          ? invokePlugin(plugin.id, 'get_document_sessions', new Map())
          : getPluginDetail(plugin.id);
      
    fetchData
      .then((response) => {
        if (active) {
            // FrontendAgent 2026-03-05: Map info_type to ui_target and unwrap data payload
            
            // 1. Determine UI Target
            // Prioritize payload.ui_target/info_type as per new backend structure
            const payload = response?.payload;
            const uiTarget = payload?.ui_target || payload?.info_type || response?.ui_target || response?.info_type;
            
            if (uiTarget) {
                setUiTarget(uiTarget);
            }

            // 2. Set Data Payload
            // The component expects the inner data object
            if (payload?.data) {
                setData(payload.data);
            } else if (payload) {
                // Fallback: use payload itself if data property is missing
                setData(payload);
            } else if (response?.data) {
                 // Old format fallback
                setData(response.data);
            } else {
                 // Raw response fallback
                setData(response);
            }
        }
      })
      .catch((e) => {
        console.error(e);
        if (active) setDataError('无法获取插件数据');
      })
      .finally(() => {
        if (active) setIsLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, plugin.id, plugin.manifest, plugin.operations]);

  const handleSave = () => {
    onSave(configValues);
    setIsEditingConfig(false);
  };

  const handleConfigChange = (key: string, value: any) => {
      setConfigValues(prev => ({
          ...prev,
          [key]: value
      }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="w-full max-w-[1000px] max-h-[680px] h-full bg-white rounded-2xl shadow-modal flex flex-col overflow-hidden ring-1 ring-gray-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 shadow-inner">
               <Settings className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-text-primary tracking-tight">{plugin.name}</h3>
              <p className="text-xs text-text-secondary font-medium">Plugin Dashboard</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 min-h-0 bg-gray-50 p-5 overflow-hidden">
          <div className="h-full grid grid-cols-12 gap-6">
            
            {/* Left Column: Configuration Card */}
            <div className="col-span-4 h-full flex flex-col">
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-card-soft overflow-hidden flex flex-col">
                 <div className="p-5 h-full overflow-hidden">
                   <ConfigRenderer 
                       fields={configFields}
                       configValues={configValues}
                       onConfigChange={handleConfigChange}
                       onSave={handleSave}
                       isEditing={isEditingConfig}
                       onToggleEdit={() => setIsEditingConfig(!isEditingConfig)}
                   />
                 </div>
              </div>
            </div>

            {/* Right Column: Data / Preview Card */}
            <div className="col-span-8 h-full flex flex-col">
               <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-card-soft overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                     <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <h4 className="font-serif font-bold text-gray-800">Live Preview</h4>
                     </div>
                     {uiTarget && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-mono border border-gray-200">
                          {uiTarget}
                        </span>
                     )}
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 overflow-y-auto p-5 relative bg-gray-50">
                     {isLoadingData ? (
                       <DataSkeleton />
                     ) : dataError ? (
                       <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                             <X className="w-8 h-8 text-red-400" />
                          </div>
                          <h5 className="text-gray-900 font-bold mb-1">加载失败</h5>
                          <p className="text-sm text-gray-500">{dataError}</p>
                       </div>
                     ) : data ? (
                        uiTarget ? (
                           <div className="animate-in fade-in zoom-in-95 duration-300">
                              <SDUIRenderer ui_target={uiTarget} props={data} />
                           </div>
                        ) : (
                           // Fallback when uiTarget is missing but data exists
                           <div className="h-full flex flex-col items-center justify-center text-center p-8">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200 border-dashed">
                                 <Database className="w-6 h-6 text-gray-400" />
                              </div>
                              <h5 className="text-gray-400 font-bold mb-1">暂无预览组件</h5>
                              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                此插件返回了数据，但未指定 UI 组件 (ui_target)。
                              </p>
                           </div>
                        )
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <Database className="w-12 h-12 text-gray-200 mb-4" />
                          <p className="text-sm text-gray-300">暂无数据</p>
                       </div>
                     )}
                  </div>
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
