"use client";
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PluginInstance, ConfigField } from '@/types/plugin';
import { getPluginDetail, updatePlugin } from '@/services/pluginService';
import { ConfigRenderer } from './plugin-renderers/ConfigRenderer';
import { logger } from '@/lib/logger';

import { PluginDetailsInfo } from '../plugins/agent-manager/PluginDetailsInfo';
import { invokePluginOperation } from '@/services/pluginService';

interface PluginManagerModalProps {
  plugin: PluginInstance;
  onClose: () => void;
}

const PluginManagerModal: React.FC<PluginManagerModalProps> = ({ plugin, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any>(null);

  const isAgentManager = plugin.name === 'agent_manager' || plugin.name.includes('Agent管理') || plugin.id === 'agent_manager';

  useEffect(() => {
    if (plugin) {
        setIsLoading(true);
        setError(null);

        if (isAgentManager) {
            // Load Agent Manager specific data
            invokePluginOperation(plugin.id, 'get_agent_info_in_card', {})
                .then(result => {
                    if (result) {
                        if ('payload' in result) {
                             // Assuming payload is { name:..., data: { agents: ... }, ... }
                             setAgentData((result as any).payload);
                        } else {
                             setAgentData(result);
                        }
                    } else {
                        setError('未获取到 Agent 数据');
                    }
                })
                .catch(err => {
                    logger.error('Failed to load agent data', err);
                    setError('加载 Agent 数据失败');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            // Standard Config Loading
            getPluginDetail(plugin.id).then(detail => {
                if (detail && Array.isArray(detail.config)) {
                    setConfigFields(detail.config);
                    
                    // Initialize values from config schema
                    // Assuming detail.config has current values or defaults
                    const initialValues: Record<string, any> = {};
                    detail.config.forEach(field => {
                        initialValues[field.key] = field.value !== undefined ? field.value : '';
                    });
                    setConfigValues(initialValues);
                } else {
                    // If config is null or undefined or not an array, just set empty
                    setConfigFields([]);
                    setConfigValues({});
                }
            }).catch(err => {
                logger.error('Failed to load plugin details', err);
                setError('加载插件配置失败');
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }
  }, [plugin, isAgentManager]);

  const handleConfigChange = (key: string, value: any) => {
    setConfigValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
        setIsLoading(true);
        // Transform configValues back to what backend expects if necessary
        // Currently updatePlugin takes { config: ... } but backend expects map
        // Let's assume backend expects a flat map of key-values
        
        await updatePlugin(plugin.id, {
            config: configValues
        });
        
        onClose();
    } catch (err) {
        logger.error('Failed to save plugin config', err);
        setError('保存配置失败');
    } finally {
        setIsLoading(false);
    }
  };

  const configNode = (
      <ConfigRenderer
          fields={configFields}
          configValues={configValues}
          onConfigChange={handleConfigChange}
          onSave={handleSave}
      />
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="w-[800px] max-w-[90vw] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{plugin.name}</h2>
            <p className="text-xs text-text-secondary">配置插件选项</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">加载中...</span>
                    </div>
                </div>
            )}

            {error ? (
                <div className="flex items-center justify-center h-full text-error">
                    {error}
                </div>
            ) : (
                isAgentManager ? (
                    <div className="h-full p-6 bg-gray-50/50">
                        <PluginDetailsInfo 
                            data={agentData ? agentData.data : null} 
                            pluginId={plugin.id}
                            configNode={configNode}
                        />
                    </div>
                ) : (
                    configNode
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default PluginManagerModal;
