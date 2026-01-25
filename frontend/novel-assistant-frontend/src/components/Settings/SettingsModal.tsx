import React, { useState } from 'react';
import { Settings, X, ChevronDown, ChevronRight, RotateCcw, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-02
 * 创建时间: 2026-01-20 21:48
 * 更新时间: 2026-01-20 21:48
 * 更新记录:
 * - [2026-01-20 21:48:FE-REF-20260120-02: 在何处使用: 系统设置弹窗；如何使用: 由父组件控制 isOpen/onClose；实现概述: 清理未使用 import，移除直接 console 输出，避免误用类 API Key 占位符。]
 */

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'system' | 'agent' | 'future';

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config: {
    base_url: string;
    model_name: string;
    api_key: string;
  };
}

const MOCK_AGENTS: AgentConfig[] = [
  {
    id: 'agent-1',
    name: 'Novel Writer',
    description: '负责小说正文生成的智能助手，擅长环境描写和对话构建。',
    enabled: true,
    config: {
      base_url: 'https://api.openai.com/v1',
      model_name: 'gpt-4',
      api_key: ''
    }
  },
  {
    id: 'agent-2',
    name: 'Plot Advisor',
    description: '剧情规划顾问，帮助梳理故事大纲和情节发展。',
    enabled: true,
    config: {
      base_url: 'https://api.anthropic.com',
      model_name: 'claude-3-opus',
      api_key: ''
    }
  },
  {
    id: 'agent-3',
    name: 'Character Designer',
    description: '角色设计专家，生成详细的人物小传和性格特征。',
    enabled: false,
    config: {
      base_url: 'https://api.deepseek.com',
      model_name: 'deepseek-chat',
      api_key: ''
    }
  }
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('system');
  const [agents, setAgents] = useState<AgentConfig[]>(MOCK_AGENTS);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Reset logic (deep copy mock data)
  const handleReset = () => {
    setAgents(JSON.parse(JSON.stringify(MOCK_AGENTS)));
  };

  // Save single config (mock)
  const handleSave = (id: string) => {
    // In real app, this would make an API call
    logger.debug('Saving config for agent:', id);
    // Show quick feedback?
  };

  // Global confirm
  const handleConfirm = () => {
    logger.debug('Global confirm:', agents);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 2000);
  };

  const updateAgentConfig = (id: string, field: keyof AgentConfig['config'], value: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === id) {
        return {
          ...agent,
          config: {
            ...agent.config,
            [field]: value
          }
        };
      }
      return agent;
    }));
  };

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(agent => {
        if (agent.id === id) {
            return { ...agent, enabled: !agent.enabled };
        }
        return agent;
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="w-[900px] h-[600px] bg-surface-white rounded-2xl border border-gray-200 shadow-2xl flex overflow-hidden animate-scale-up relative mx-4">
        
        {/* Top Left Icon */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            <span className="font-serif font-bold text-lg">Settings</span>
        </div>

        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 pt-20 flex flex-col bg-gray-50/50">
            <button 
                onClick={() => setActiveTab('system')}
                className={`w-full text-left px-8 py-4 font-serif text-sm font-bold transition-colors border-l-4 ${activeTab === 'system' ? 'border-black bg-white' : 'border-transparent hover:bg-gray-100 text-gray-500'}`}
            >
                System
            </button>
            <div className="w-48 mx-auto border-b border-gray-200/50 my-1"></div>
            <button 
                onClick={() => setActiveTab('agent')}
                className={`w-full text-left px-8 py-4 font-serif text-sm font-bold transition-colors border-l-4 ${activeTab === 'agent' ? 'border-black bg-white' : 'border-transparent hover:bg-gray-100 text-gray-500'}`}
            >
                Agent
            </button>
            <div className="w-48 mx-auto border-b border-gray-200/50 my-1"></div>
            <button 
                onClick={() => setActiveTab('future')}
                className={`w-full text-left px-8 py-4 font-serif text-sm font-bold transition-colors border-l-4 ${activeTab === 'future' ? 'border-black bg-white' : 'border-transparent hover:bg-gray-100 text-gray-400'}`}
            >
                敬请期待
            </button>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col relative bg-white">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-20"
            >
                <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex-1 overflow-y-auto p-12 pt-20">
                {activeTab === 'system' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-2xl font-serif font-bold mb-8">System Config</h2>
                        
                        <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Theme</h3>
                                    <p className="text-xs text-gray-500 font-serif">选择系统的外观主题</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold">Light</button>
                                    <button className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-200">Dark</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'agent' && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-serif font-bold mb-2">Agent Config</h2>
                        
                        {agents.map(agent => (
                            <div key={agent.id} className="border-b border-gray-100 pb-6 last:border-0">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-lg">{agent.name}</h3>
                                            <div 
                                                className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${agent.enabled ? 'bg-black' : 'bg-gray-200'}`}
                                                onClick={() => toggleAgent(agent.id)}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${agent.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 font-serif leading-relaxed max-w-md">
                                            {agent.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Expandable Config */}
                                <div className="mt-2">
                                    <button 
                                        onClick={() => setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)}
                                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors mb-4"
                                    >
                                        {expandedAgentId === agent.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        配置项
                                    </button>

                                    {expandedAgentId === agent.id && (
                                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4 animate-slide-down">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold mb-1.5">Base URL</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-serif outline-none focus:border-black transition-colors"
                                                        value={agent.config.base_url}
                                                        onChange={(e) => updateAgentConfig(agent.id, 'base_url', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold mb-1.5">Model Name</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-serif outline-none focus:border-black transition-colors"
                                                            value={agent.config.model_name}
                                                            onChange={(e) => updateAgentConfig(agent.id, 'model_name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold mb-1.5">API Key</label>
                                                        <input 
                                                            type="password" 
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-serif outline-none focus:border-black transition-colors"
                                                            value={agent.config.api_key}
                                                            onChange={(e) => updateAgentConfig(agent.id, 'api_key', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button 
                                                    onClick={() => handleSave(agent.id)}
                                                    className="text-xs font-bold text-black underline decoration-2 hover:text-gray-600"
                                                >
                                                    保存此配置
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'future' && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 animate-fade-in">
                        <div className="text-4xl font-serif font-bold mb-4 opacity-20">COMING SOON</div>
                        <p className="font-serif text-sm">更多功能敬请期待...</p>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30">
                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                </button>
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-black border-2 border-transparent hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleConfirm}
                    className="
                        flex items-center gap-2 px-8 py-2.5 bg-black text-white rounded-xl text-xs font-bold 
                        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] 
                        hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] 
                        active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
                    "
                >
                    <Check className="w-3.5 h-3.5" />
                    Confirm
                </button>
            </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-down z-[110]">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold">配置已生效</span>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;
