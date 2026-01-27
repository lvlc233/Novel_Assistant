
"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { agentService } from '@/services/agentService';

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
}

// --- Context ---

const MailContext = createContext<MailContextType | undefined>(undefined);

export const MailProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string | 'all'>('all');
  const [latestNotification, setLatestNotification] = useState<MailMessage | null>(null);

  // Load Agents on Mount
  useEffect(() => {
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
  }, []);

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
        agentService.chatStream(
            agentId,
            threadId,
            { context: content, messages_type: 'text' },
            (responseText) => {
                // On Response
                sendMessage(agentId, responseText, 'text');
            },
            () => {
                // On Finish
                logger.debug(`Agent ${agentId} finished replying`);
            },
            (err) => {
                // On Error
                logger.error(`Error invoking agent ${agentId}`, err);
                sendMessage('system', `调用 ${agentId} 失败: ${String(err)}`, 'notification');
            }
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
      clearNotification
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
