"use client";
import React from 'react';
import BottomInput from '@/components/common/BottomInput';
import { invokePlugin } from '@/services/pluginService';
import { logger } from '@/lib/logger';
import { useMail } from '@/contexts/MailContext';

interface ProjectChatInputProps {
  pluginId: string;
  operationName?: string;
  pageId?: string;
  placeholder?: string;
}

export const ProjectChatInput: React.FC<ProjectChatInputProps> = ({
  pluginId,
  operationName = 'call',
  pageId = 'home',
  placeholder = '快速指令 / 询问 AI...'
}) => {
  const { sendNotification } = useMail();
  
  const handleSubmit = async (value: string, files?: File[]) => {
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
      const payload = new Map<string, any>();
      payload.set('query', value);
      payload.set('page_id', pageId);

      // Invoke the plugin operation
      await invokePlugin(pluginId, operationName, payload);
      
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
    <BottomInput
      position="fixed"
      placeholder={placeholder}
      onSubmit={handleSubmit}
    />
  );
};
