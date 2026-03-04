import React, { useState } from 'react';
import { invokePluginOperation } from '@/services/pluginService';
import { logger } from '@/lib/logger';
import { Mail, MessageSquare } from 'lucide-react';

interface AgentInfo {
    agent_name: string;
    on_email: boolean;
    history: any[];
}

interface PluginDetailsInfoProps {
  data: { agents: AgentInfo[] };
  pluginId: string;
}

export const PluginDetailsInfo: React.FC<PluginDetailsInfoProps> = ({ data, pluginId }) => {
  const [agents, setAgents] = useState<AgentInfo[]>(data?.agents || []);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleEmailToggle = async (agentName: string, checked: boolean) => {
    setUpdating(agentName);
    try {
        await invokePluginOperation(pluginId, 'update_agent_email_state', {
            agent_name: agentName,
            on_email: checked
        });
        
        setAgents(prev => prev.map(a => 
            a.agent_name === agentName ? { ...a, on_email: checked } : a
        ));

    } catch (error) {
        logger.error('Failed to update email state:', error);
        alert('更新失败，请重试');
    } finally {
        setUpdating(null);
    }
  };

  if (!agents || agents.length === 0) {
      return <div className="text-center text-gray-500 py-10">暂无 Agent</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
            <div key={agent.agent_name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {agent.agent_name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{agent.agent_name}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MessageSquare className="w-3 h-3" />
                                <span>{agent.history?.length || 0} 个会话</span>
                            </div>
                        </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={agent.on_email}
                            disabled={updating === agent.agent_name}
                            onChange={(e) => handleEmailToggle(agent.agent_name, e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>邮件通知: {agent.on_email ? '已开启' : '已关闭'}</span>
                    {updating === agent.agent_name && <span className="ml-auto text-blue-500">更新中...</span>}
                </div>
            </div>
        ))}
    </div>
  );
};
