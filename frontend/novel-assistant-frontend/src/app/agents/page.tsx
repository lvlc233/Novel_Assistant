"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Search, 
  MessageSquare, 
  Settings,
  Wifi
} from 'lucide-react';
import { agentService } from '@/services/agentService';
import { AgentMeta } from '@/types/agent';
import { SlotInjector } from '@/components/common/SlotInjector';
import { AppLayout } from '@/components/layout/AppLayout';

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await agentService.getAgents();
        setAgents(data);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(a => 
    a.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.agent_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
       <SlotInjector slotId="header-breadcrumb">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/home" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <span className="text-text-primary">Agents</span>
          </div>
      </SlotInjector>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bot className="w-8 h-8 text-accent-primary" />
            Agent Orchestration
          </h1>
          <p className="text-text-secondary mt-1">Manage and interact with intelligent agents</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents..."
          className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading agents...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-16 bg-surface-secondary/30 border border-dashed border-border-primary rounded-xl">
          <Bot className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <h3 className="text-lg font-medium text-text-primary">No agents found</h3>
          <p className="text-text-secondary max-w-sm mx-auto mt-2">
            System agents are not available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.agent_id}
              className="group flex flex-col bg-surface-primary border border-border-primary rounded-xl overflow-hidden hover:border-accent-primary/50 hover:shadow-md transition-all"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                         {agent.broadcast && (
                             <div className="p-1.5 rounded-lg bg-green-50 text-green-600" title="Broadcast Enabled">
                                 <Wifi className="w-4 h-4" />
                             </div>
                         )}
                         <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                             agent.enable 
                                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                         }`}>
                             {agent.enable ? 'Active' : 'Inactive'}
                         </div>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-text-primary mb-2">{agent.agent_name}</h3>
                <p className="text-sm text-text-secondary line-clamp-2 h-10 mb-4">
                    {agent.agent_description || 'No description available.'}
                </p>
              </div>

              <div className="p-4 bg-surface-secondary/50 border-t border-border-primary flex items-center gap-2">
                  <Link
                    href={`/agents/${agent.agent_id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-surface-primary border border-border-primary hover:bg-accent-primary hover:text-white hover:border-accent-primary text-text-primary rounded-lg transition-all font-medium text-sm shadow-sm"
                  >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                  </Link>
                  <button className="p-2 bg-surface-primary border border-border-primary hover:bg-surface-hover text-text-secondary rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </AppLayout>
  );
}
