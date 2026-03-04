"use client";
import React from 'react';
// import BottomInput from '@/components/common/BottomInput';
import { invokePluginOperation } from '@/services/pluginService';
import { logger } from '@/lib/logger';
import { useMail } from '@/contexts/MailContext';

interface ProjectChatInputProps {
  pluginId: string;
  operationName?: string;
  pageId?: string;
  placeholder?: string;
  position?: 'fixed' | 'static' | 'absolute';
}

export const ProjectChatInput: React.FC<ProjectChatInputProps> = ({
  pluginId,
  operationName = 'chat_input', // Updated to match backend operation name
  pageId = 'home',
  placeholder = '快速指令 / 询问 AI...',
  position = 'fixed'
}) => {
  const { sendNotification } = useMail();
  
  const handleSubmit = async (value: string) => {
    try {
      if (!pluginId) {
        logger.error('ProjectChatInput: pluginId is missing');
        sendNotification({
            id: Date.now().toString(),
            title: '配置错误',
            content: 'ProjectChatInput: pluginId is missing',
            timestamp: Date.now(),
            senderId: 'system',
            isRead: false
        });
        return;
      }

      logger.info(`Sending message to plugin ${pluginId}, op: ${operationName}, query: ${value}`);
      
      // Construct payload map as expected by backend
      const params = {
          query: value,
          page_id: pageId
      };

      // Invoke the plugin operation
      await invokePluginOperation(pluginId, operationName, params);
      
    } catch (error: any) {
      logger.error('Failed to invoke project chat agent:', error);
      // Show user-friendly error notification
      sendNotification({
        id: Date.now().toString(),
        title: '插件调用失败',
        content: `调用 ${pluginId} 失败: ${error.message || '未知错误'}`,
        timestamp: Date.now(),
        senderId: 'system',
        isRead: false
      });
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto ${position === 'fixed' ? 'fixed bottom-8 left-1/2 -translate-x-1/2 z-50' : ''}`}>
        <div className="relative flex items-center w-full p-2 bg-white rounded-full shadow-xl border border-stone-100">
            <input 
                type="text" 
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-stone-700 placeholder:text-stone-400"
                placeholder={placeholder}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e.currentTarget.value);
                        e.currentTarget.value = '';
                    }
                }}
            />
            <button className="p-2 bg-stone-900 text-white rounded-full hover:bg-stone-700 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
    </div>
  );
};
