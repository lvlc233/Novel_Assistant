import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { invokePluginOperation } from '@/services/pluginService';
import { AgentManagerModal } from './AgentManagerModal';
import { logger } from '@/lib/logger';
import FeatureCard from '@/components/dashboard/FeatureCard';

interface PluginCardProps {
  name: string;
  pluginId: string;
  operationName: string; 
}

export const PluginCard: React.FC<PluginCardProps> = ({ name, pluginId, operationName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e?: React.MouseEvent) => {
    // e?.stopPropagation(); // FeatureCard onClick doesn't pass event usually, but if it does...
    setIsOpen(true);
    setLoading(true);
    try {
      const result = await invokePluginOperation(pluginId, operationName || 'get_agent_info_in_card', {});
      
      // Handle response structure: backend returns the data directly
      if (result) {
          // If result has payload (from some other structure), use it
          if ('payload' in result) {
              setDetailsData((result as any).payload);
          } else {
              // Otherwise use result directly
              setDetailsData(result);
          }
      } else {
          logger.warn("invokePluginOperation returned empty result");
      }
    } catch (error: any) {
      logger.error('Failed to fetch agent details:', error);
      alert(`获取数据失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="snap-center shrink-0 py-4">
        <FeatureCard
            title={name === 'agent_manager' ? 'Agent 管理器' : name}
            icon={<Users className="w-8 h-8 text-accent-primary" />}
            color="bg-white"
            rotation="rotate-0"
            onClick={handleClick}
        />
      </div>

      {isOpen && (
        <AgentManagerModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          data={detailsData} 
          loading={loading}
          pluginId={pluginId}
        />
      )}
    </>
  );
};
