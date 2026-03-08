import React, { useState, useEffect } from 'react';
import { invokePluginOperation } from '@/services/pluginService';
import { logger } from '@/lib/logger';
import { Settings, User, Loader2, Wrench } from 'lucide-react';

interface AgentInfo {
  agent_name: string;
  description: string;
}

interface AgentToolOperation {
  name: string;
  description: string;
  enabled: boolean;
}

interface AgentToolPlugin {
  plugin_name: string;
  operations: AgentToolOperation[];
}

interface PluginDetailsInfoProps {
  data?: { agents?: AgentInfo[] } | null;
  agents?: AgentInfo[];
  pluginId?: string;
}

export const PluginDetailsInfo: React.FC<PluginDetailsInfoProps> = ({ data, agents: directAgents, pluginId }) => {
  console.log("[PluginDetailsInfo] Received props data:", data, directAgents);
  const agents = directAgents || data?.agents || [];
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentTools, setAgentTools] = useState<Record<string, AgentToolPlugin[]>>({});
  const [loadingTools, setLoadingTools] = useState<Record<string, boolean>>({});
  const [updatingTool, setUpdatingTool] = useState<string | null>(null);

  // Initialize selected agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0].agent_name);
    }
  }, [agents, selectedAgent]);

  // Load tools when selected agent changes
  useEffect(() => {
    if (!selectedAgent) return;
    if (agentTools[selectedAgent]) return; // already loaded

    const loadTools = async () => {
      setLoadingTools(prev => ({ ...prev, [selectedAgent]: true }));
      try {
        const result = await invokePluginOperation(pluginId, 'list_agent_plugins', {
          agent_name: selectedAgent
        });
        
        let toolData = [];
        if (result && 'payload' in (result as any)) {
            toolData = (result as any).payload;
        } else {
            toolData = result as AgentToolPlugin[];
        }

        setAgentTools(prev => ({ ...prev, [selectedAgent]: toolData }));
      } catch (error) {
        logger.error(`Failed to fetch tools for ${selectedAgent}:`, error);
      } finally {
        setLoadingTools(prev => ({ ...prev, [selectedAgent]: false }));
      }
    };

    loadTools();
  }, [selectedAgent, pluginId, agentTools]);

  const handleToolToggle = async (pluginName: string, opName: string, checked: boolean) => {
    if (!selectedAgent) return;
    
    const operationKey = `${selectedAgent}-${pluginName}-${opName}`;
    setUpdatingTool(operationKey);
    
    try {
      await invokePluginOperation(pluginId, 'update_agent_tool_state', {
        agent_name: selectedAgent,
        plugin_name: pluginName,
        tool_name: opName,
        enabled: checked
      });
      
      // Update local state
      setAgentTools(prev => {
        const currentTools = prev[selectedAgent] || [];
        const updatedTools = currentTools.map(plugin => {
          if (plugin.plugin_name === pluginName) {
            return {
              ...plugin,
              operations: plugin.operations.map(op => 
                op.name === opName ? { ...op, enabled: checked } : op
              )
            };
          }
          return plugin;
        });
        return { ...prev, [selectedAgent]: updatedTools };
      });
    } catch (error) {
      logger.error('Failed to update tool state:', error);
    } finally {
      setUpdatingTool(null);
    }
  };

  const currentTools = selectedAgent ? agentTools[selectedAgent] || [] : [];
  const isLoading = selectedAgent ? loadingTools[selectedAgent] : false;

  return (
    <div className="flex absolute inset-0 gap-6">
      {/* Left: Agent List */}
      <div className="w-1/3 min-w-[200px] border-r border-gray-100 pr-6 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700 shrink-0">
          <User className="w-4 h-4" />
          <span>可用 Agent 列表</span>
        </div>
        
        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto space-y-2 pr-2">
            {agents.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8">无可用 Agent</div>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.agent_name}
                  onClick={() => setSelectedAgent(agent.agent_name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    selectedAgent === agent.agent_name
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    selectedAgent === agent.agent_name ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {agent.agent_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      selectedAgent === agent.agent_name ? 'text-blue-900' : 'text-gray-800'
                    }`}>
                      {agent.agent_name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate mt-0.5">
                      {agent.description || '无系统描述'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Tool Configuration */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700 shrink-0">
          <Wrench className="w-4 h-4" />
          <span>{selectedAgent ? `${selectedAgent} - 工具配置` : '工具配置'}</span>
        </div>

        <div className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-2 text-text-secondary">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-sm">加载工具配置...</span>
              </div>
            </div>
          ) : !selectedAgent ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              请在左侧选择一个 Agent
            </div>
          ) : currentTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Wrench className="w-8 h-8 opacity-20" />
              <span className="text-sm">该 Agent 没有可用工具</span>
            </div>
          ) : (
            <div className="absolute inset-0 overflow-y-auto p-4 space-y-6">
              {currentTools.map((plugin) => (
                <div key={plugin.plugin_name} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
                  <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="font-bold text-sm text-gray-800">插件: {plugin.plugin_name}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {plugin.operations.map((op) => {
                      const operationKey = `${selectedAgent}-${plugin.plugin_name}-${op.name}`;
                      const isUpdating = updatingTool === operationKey;
                      
                      return (
                        <div key={op.name} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                          <div className="pr-4">
                            <div className="text-sm font-medium text-gray-800">{op.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{op.description || '无操作描述'}</div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={op.enabled}
                                disabled={isUpdating}
                                onChange={(e) => handleToolToggle(plugin.plugin_name, op.name, e.target.checked)}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
