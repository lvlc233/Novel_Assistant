import React from 'react';
import { Bot, MessageSquare, Radio, HardDrive, Activity } from 'lucide-react';
import { Switch } from '@/components/ui/switch'; // Assuming we have a Switch component or use a simple HTML one
import { Input } from '@/components/ui/input';

/**
 * 开发者: FrontendAgent(react)
 * 创建时间: 2026-01-30 16:30
 * 说明: Agent管理插件的专用配置编辑器
 */

interface AgentItem {
    id: string;
    name: string;
    description: string;
    context_size: number;
    is_summary: boolean;
    enabled: boolean;
    broadcast: boolean;
    sessions?: string[];
}

interface AgentConfig {
    agents: AgentItem[];
}

interface AgentConfigEditorProps {
    config: AgentConfig;
    onChange: (newConfig: AgentConfig) => void;
}

const AgentConfigEditor: React.FC<AgentConfigEditorProps> = ({ config, onChange }) => {
    const agents = config.agents || [];

    const handleUpdate = (index: number, field: keyof AgentItem, value: any) => {
        const newAgents = [...agents];
        newAgents[index] = { ...newAgents[index], [field]: value };
        onChange({ ...config, agents: newAgents });
    };

    if (agents.length === 0) {
        return <div className="text-gray-400 text-sm text-center py-8">暂无 Agent 配置</div>;
    }

    return (
        <div className="space-y-6">
            {agents.map((agent, index) => (
                <div key={agent.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{agent.name}</h3>
                                <p className="text-xs text-gray-500 font-serif line-clamp-1" title={agent.description}>
                                    {agent.description}
                                </p>
                            </div>
                        </div>
                        
                        {/* Main Enable Switch */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">{agent.enabled ? 'Enabled' : 'Disabled'}</span>
                            <div 
                                className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${agent.enabled ? 'bg-black' : 'bg-gray-200'}`}
                                onClick={() => handleUpdate(index, 'enabled', !agent.enabled)}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${agent.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                        {/* Context Size */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <HardDrive size={12} />
                                上下文限制 (Tokens)
                            </label>
                            <input 
                                type="number"
                                className="w-full bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-black transition-colors"
                                value={agent.context_size}
                                onChange={(e) => handleUpdate(index, 'context_size', parseInt(e.target.value) || -1)}
                                placeholder="-1 为无限制"
                            />
                            <p className="text-[10px] text-gray-400">-1 表示不限制，0 表示无历史</p>
                        </div>

                        {/* Broadcast & Summary Switches */}
                        <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <Radio size={12} />
                                    全局广播 (Broadcast)
                                </label>
                                <div 
                                    className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${agent.broadcast ? 'bg-green-500' : 'bg-gray-200'}`}
                                    onClick={() => handleUpdate(index, 'broadcast', !agent.broadcast)}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${agent.broadcast ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                             </div>

                             <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <Activity size={12} />
                                    自动总结 (Auto Summary)
                                </label>
                                <div 
                                    className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${agent.is_summary ? 'bg-blue-500' : 'bg-gray-200'}`}
                                    onClick={() => handleUpdate(index, 'is_summary', !agent.is_summary)}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${agent.is_summary ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    {/* Sessions Info (Read Only) */}
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
                        <MessageSquare size={10} />
                        <span>活跃会话: {agent.sessions?.length || 0}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AgentConfigEditor;
