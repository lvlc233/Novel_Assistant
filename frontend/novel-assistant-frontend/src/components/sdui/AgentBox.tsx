import React from 'react';
import { Mail } from 'lucide-react';

interface Agent {
  name: string;
  on_email: boolean;
  status?: string;
}

interface AgentBoxProps {
  agents?: Agent[];
}

export const AgentBox: React.FC<AgentBoxProps> = ({ agents = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <Mail className="w-5 h-5 text-gray-500" />
        Agent Status
      </h3>
      <div className="space-y-3">
        {agents.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No agents configured.</p>
          </div>
        ) : (
          agents.map((agent, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">{agent.name}</div>
              <div className="flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${agent.on_email ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs text-gray-500">{agent.on_email ? 'Email On' : 'Email Off'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
