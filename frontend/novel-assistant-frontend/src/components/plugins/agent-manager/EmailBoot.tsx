import React, { useState } from 'react';
import { invokePluginOperation } from '@/services/pluginService';
import { logger } from '@/lib/logger';
import { useMail } from '@/contexts/MailContext';
import { Mail } from 'lucide-react';

interface EmailBootProps {
  pluginId: string;
  operationName: string;
}

export const EmailBoot: React.FC<EmailBootProps> = ({ pluginId, operationName }) => {
  const { toggleMailbox, unreadCount } = useMail();

  const handleClick = async () => {
    // 1. Toggle Mailbox UI
    toggleMailbox();
    
    // 2. Trigger Plugin Operation (Optional: if we want to refresh data)
    // Actually MailContext handles data loading, but if we want to ensure latest agent info:
    try {
        await invokePluginOperation(pluginId, operationName || 'get_agent_info', {});
        // The result is currently not used directly by MailContext unless we dispatch it.
        // But assuming MailContext has its own fetching mechanism or we integrate it.
    } catch (error) {
        logger.error('Failed to invoke EmailBoot operation:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-3 bg-white rounded-full shadow-sm hover:bg-white hover:scale-110 hover:shadow-md transition-all group z-50"
      aria-label="打开信箱"
    >
      <Mail className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
      
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
        </span>
      )}
    </button>
  );
};
