import React, { useState } from 'react';
import { invokePluginOperation } from '@/services/pluginService';
import { logger } from '@/lib/logger';
import { Mail, MessageSquare, Settings, User } from 'lucide-react';
// import { Switch } from '@/components/ui/switch'; // Assuming we have a Switch component or check if available
// If Switch is not available, use input checkbox

interface Message {
    type: string;
    content: string;
}

interface AgentMessageHistoryItem {
    agent_name?: string;
    session_id: string;
    messages: Message[];
}

interface AgentInfo {
    agent_name: string;
    on_email: boolean;
    history: AgentMessageHistoryItem[];
}

interface PluginDetailsInfoProps {
  data: { agents: AgentInfo[] } | null;
  pluginId: string;
  configNode?: React.ReactNode;
}

export const PluginDetailsInfo: React.FC<PluginDetailsInfoProps> = ({ data, pluginId, configNode }) => {
  const [agents, setAgents] = useState<AgentInfo[]>(data?.agents || []);
  
  // Sync state when data changes
  React.useEffect(() => {
      if (data?.agents) {
          setAgents(data.agents);
      }
  }, [data]);

  const [updating, setUpdating] = useState<string | null>(null);

  const handleEmailToggle = async (agentName: string, checked: boolean) => {
    // ... existing logic ...
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
    } finally {
        setUpdating(null);
    }
  };

  return (
    <div className="flex h-full gap-6">
        {/* Left: Config Section */}
        <div className="w-1/3 min-w-[250px] border-r border-gray-100 pr-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700">
                <Settings className="w-4 h-4" />
                <span>配置选项</span>
            </div>
            
            <div className="flex-1 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 overflow-hidden relative">
                {configNode ? (
                    <div className="h-full overflow-y-auto p-4">
                        {configNode}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                        空
                    </div>
                )}
            </div>
        </div>

        {/* Right: Agent List Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700">
                <User className="w-4 h-4" />
                <span>插件数据</span>
            </div>

            {!agents || agents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
                    空
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {agents.map((agent) => (
                        <div key={agent.agent_name} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Agent Header */}
                            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {agent.agent_name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{agent.agent_name}</div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            <span>邮件通知</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {updating === agent.agent_name && (
                                        <span className="text-[10px] text-blue-500 animate-pulse">更新中...</span>
                                    )}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={agent.on_email}
                                            disabled={updating === agent.agent_name}
                                            onChange={(e) => handleEmailToggle(agent.agent_name, e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Sessions List */}
                            <div className="p-4 bg-white">
                                {(!agent.history || agent.history.length === 0) ? (
                                    <div className="text-center py-4 text-xs text-gray-400 border border-dashed border-gray-100 rounded-lg">
                                        暂无会话记录
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {agent.history.map((session, idx) => (
                                            <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:border-blue-100 transition-colors group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 truncate max-w-[200px]" title={session.session_id}>
                                                        {session.session_id}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <MessageSquare className="w-3 h-3" />
                                                        <span>{session.messages.length}</span>
                                                    </div>
                                                </div>

                                                {/* Visual Bars for Messages */}
                                                <div className="flex gap-0.5 h-1.5 overflow-hidden rounded-full bg-gray-50">
                                                    {session.messages.map((msg, mIdx) => (
                                                        <div 
                                                            key={mIdx} 
                                                            className={`w-3 h-full ${
                                                                msg.type === 'human' ? 'bg-blue-400' : 
                                                                msg.type === 'ai' ? 'bg-green-400' : 
                                                                'bg-gray-300'
                                                            }`}
                                                            title={`${msg.type}: ${msg.content.substring(0, 50)}`}
                                                        />
                                                    ))}
                                                </div>
                                                
                                                {/* Latest Message Preview */}
                                                {session.messages.length > 0 && (
                                                    <div className="mt-2 text-[10px] text-gray-600 truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <span className={`font-bold mr-1 ${
                                                            session.messages[session.messages.length - 1].type === 'human' ? 'text-blue-600' : 'text-green-600'
                                                        }`}>
                                                            {session.messages[session.messages.length - 1].type === 'human' ? 'User' : 'Agent'}:
                                                        </span>
                                                        {session.messages[session.messages.length - 1].content}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
