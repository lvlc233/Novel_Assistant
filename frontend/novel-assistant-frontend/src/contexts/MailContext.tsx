
"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { agentService } from '@/services/agentService';
// import {subscribePluginFeatureFlagsChanged } from '@/services/pluginService';

// --- Types ---

export interface Agent {
  id: string;
  name: string;
  avatar?: string; // URL or Initials
  role: string;
  description?: string;
}

export interface MailMessage {
  id: string;
  senderId: string; // Refers to Agent.id or 'user'
  content: string; // Markdown supported
  timestamp: number;
  isRead: boolean;
  context?: string; // Optional context about where this message came from
  type: 'text' | 'task' | 'notification';
}

interface MailContextType {
  isOpen: boolean;
  toggleMailbox: () => void;
  openMailbox: () => void;
  closeMailbox: () => void;
  
  messages: MailMessage[];
  unreadCount: number;
  agents: Agent[];
  
  currentFilter: string | 'all'; // 'all' or agentId
  setFilter: (agentId: string | 'all') => void;
  
  sendMessage: (senderId: string, content: string, type?: MailMessage['type']) => void;
  sendToAgent: (agentId: string, content: string) => Promise<void>; // New method for real interaction
  markAsRead: (messageId: string) => void;
  markAllAsRead: () => void;
  
  // For Toast Notification
  latestNotification: MailMessage | null;
  clearNotification: () => void;
  sendNotification: (message: MailMessage) => void;
}

// --- Context ---

const MailContext = createContext<MailContextType | undefined>(undefined);

export const MailProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string | 'all'>('all');
  const [latestNotification, setLatestNotification] = useState<MailMessage | null>(null);
  const [isMailEnabled, setIsMailEnabled] = useState(false);

  // Load Agents on Mount
  // useEffect(() => {
  //   let isActive = true;
  //   const loadFlags = (force = false) => {
  //     getPluginFeatureFlags({ force })
  //       .then((flags) => {
  //         if (!isActive) return;
  //         setIsMailEnabled(flags.mail);
  //       })
  //       .catch((error) => {
  //         logger.error('MailContext plugin flags load failed', error);
  //         if (!isActive) return;
  //         setIsMailEnabled(false);
  //       });
  //   };
  //   loadFlags();
  //   /**
  //    * 注释者: FrontendAgent(react)
  //    * 时间: 2026-02-23 22:12:00
  //    * 说明: 在何处使用: 邮箱上下文插件状态刷新；如何使用: 订阅插件变更事件并强制刷新；实现概述: 插件安装/移除后更新邮箱可用状态。
  //    */
  //   const unsubscribe = subscribePluginFeatureFlagsChanged(() => loadFlags(true));
  //   return () => {
  //     isActive = false;
  //     unsubscribe();
  //   };
  // }, []);

  /**
   * 注释者: FrontendAgent(react)
   * 时间: 2026-02-23 21:44:00
   * 说明: 在何处使用: 邮箱上下文数据加载；如何使用: 根据插件状态决定是否拉取 Agent 列表；实现概述: 仅在邮箱插件启用时触发数据加载。
   */
  useEffect(() => {
    if (!isMailEnabled) {
      return;
    }
    const fetchAgents = async () => {
        try {
            const metaList = await agentService.getAgents();
            const mappedAgents: Agent[] = metaList.map(meta => ({
                id: meta.agent_id,
                name: meta.agent_name,
                role: 'Assistant', // Default role, could be refined based on type if available
                description: meta.agent_description,
                avatar: undefined // Will use initials
            }));
            
            // Add System "Agent" if not present
            if (!mappedAgents.find(a => a.id === 'system')) {
                mappedAgents.unshift({
                    id: 'system',
                    name: '系统通知',
                    role: 'System',
                    description: '系统级消息与更新'
                });
            }
            
            setAgents(mappedAgents);
        } catch (error) {
            logger.error('Failed to load agents for mailbox', error);
        }
    };
    fetchAgents();
  }, [isMailEnabled]);

  // Calculate unread count
  const unreadCount = messages.filter(m => !m.isRead).length;

  const toggleMailbox = () => setIsOpen(prev => !prev);
  const openMailbox = () => setIsOpen(true);
  const closeMailbox = () => setIsOpen(false);

  const setFilter = (filter: string | 'all') => {
    setCurrentFilter(filter);
    logger.debug(`Mail filter set to: ${filter}`);
  };

  const sendMessage = (senderId: string, content: string, type: MailMessage['type'] = 'text') => {
    const newMessage: MailMessage = {
      id: Date.now().toString(),
      senderId,
      content,
      timestamp: Date.now(),
      isRead: false,
      type,
    };

    setMessages(prev => [newMessage, ...prev]);
    
    // Trigger notification if it's an AI message (not user)
    if (senderId !== 'user') {
      setLatestNotification(newMessage);
    }
    
    logger.info(`New mail message from ${senderId}`, { id: newMessage.id });
  };
  const mapRuntimeEventToText = (event: { type: string; content?: string; tool_name?: string; error_message?: string }) => {
    if (event.type === 'assistant_chunk') return event.content || '';
    if (event.type === 'tool_dispatch') return `[工具调度] ${event.tool_name || 'unknown_tool'}`;
    if (event.type === 'tool_result') return `[工具结果] ${event.tool_name || 'tool'}: ${event.content || ''}`;
    if (event.type === 'hitl_interrupt') return '[人工介入] 需要审核工具调用';
    if (event.type === 'error') return `[错误] ${event.error_message || 'unknown error'}`;
    return '';
  };

  // Real interaction with Agent
  const sendToAgent = async (agentId: string, content: string) => {
    // 1. Display User Message locally
    sendMessage('user', `(To ${agents.find(a => a.id === agentId)?.name || agentId}) ${content}`, 'text');

    if (agentId === 'system') {
        // System doesn't reply
        return;
    }

    try {
        // 2. Get or Create Thread ID
        const storageKey = `mailbox_thread_${agentId}`;
        let threadId = localStorage.getItem(storageKey);
        if (!threadId) {
            threadId = await agentService.createSession(agentId);
            localStorage.setItem(storageKey, threadId);
        }

        // 3. Invoke Agent
        // We use chatStream but since backend isn't streaming, onMessage receives full text once.
        const assistantMessageId = `${agentId}-${Date.now()}`;
        let hasCreatedAssistantMessage = false;
        const appendAssistantText = (text: string) => {
          if (!text) return;
          setMessages((prev) => {
            const existingIndex = prev.findIndex((item) => item.id === assistantMessageId);
            if (existingIndex === -1) {
              const created: MailMessage = {
                id: assistantMessageId,
                senderId: agentId,
                content: text,
                timestamp: Date.now(),
                isRead: false,
                type: 'text',
              };
              hasCreatedAssistantMessage = true;
              return [created, ...prev];
            }
            const next = [...prev];
            next[existingIndex] = {
              ...next[existingIndex],
              content: `${next[existingIndex].content}${text}`,
            };
            return next;
          });
        };
        agentService.chatStream(
            agentId,
            threadId,
            { context: content, messages_type: 'text' },
            () => {},
            () => {
                // On Finish
                logger.debug(`Agent ${agentId} finished replying`);
            },
            (err) => {
                // On Error
                logger.error(`Error invoking agent ${agentId}`, err);
                sendMessage('system', `调用 ${agentId} 失败: ${String(err)}`, 'notification');
            },
            (event) => {
              const text = mapRuntimeEventToText(event);
              if (!text) return;
              appendAssistantText(text);
              if (hasCreatedAssistantMessage) {
                const created = {
                  id: assistantMessageId,
                  senderId: agentId,
                  content: '',
                  timestamp: Date.now(),
                  isRead: false,
                  type: 'text' as const,
                };
                setLatestNotification(created);
                hasCreatedAssistantMessage = false;
              }
            },
        );

    } catch (error) {
        logger.error('Failed to send to agent', error);
        sendMessage('system', `发送失败: ${String(error)}`, 'notification');
    }
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isRead: true } : m
    ));
  };

  const markAllAsRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
  };

  const clearNotification = () => {
    setLatestNotification(null);
  };

  const sendNotification = (message: MailMessage) => {
    setLatestNotification(message);
    // Also add to messages list if needed, or keep it separate
    // For now, just show toast
  };

  return (
    <MailContext.Provider value={{
      isOpen,
      toggleMailbox,
      openMailbox,
      closeMailbox,
      messages,
      unreadCount,
      agents,
      currentFilter,
      setFilter,
      sendMessage,
      sendToAgent, // Expose this
      markAsRead,
      markAllAsRead,
      latestNotification,
      clearNotification,
      sendNotification
    }}>
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => {
  const context = useContext(MailContext);
  if (context === undefined) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
};
