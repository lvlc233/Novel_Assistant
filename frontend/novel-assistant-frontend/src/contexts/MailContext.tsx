
"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { logger } from '@/lib/logger';

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
  markAsRead: (messageId: string) => void;
  markAllAsRead: () => void;
  
  // For Toast Notification
  latestNotification: MailMessage | null;
  clearNotification: () => void;
}

// --- Mock Data ---

const MOCK_AGENTS: Agent[] = [
  { id: 'system', name: '系统通知', role: 'System', description: '系统级消息与更新' },
  { id: 'frontend', name: 'FrontendAgent', role: 'Developer', description: '前端架构与开发' },
  { id: 'writer', name: 'WriterAgent', role: 'Creative', description: '小说创作辅助' },
  { id: 'reviewer', name: 'ReviewerAgent', role: 'Editor', description: '内容审核与润色' },
];

const MOCK_MESSAGES: MailMessage[] = [
  {
    id: '1',
    senderId: 'system',
    content: '欢迎使用小说助手！这里是您的消息中心，所有 Agent 的协作信息都会汇总在这里。',
    timestamp: Date.now() - 1000000,
    isRead: false,
    type: 'text',
  },
  {
    id: '2',
    senderId: 'frontend',
    content: '前端重构已完成，Dashboard 现在支持全局邮件通知了。',
    timestamp: Date.now() - 500000,
    isRead: false,
    type: 'task',
  },
];

// --- Context ---

const MailContext = createContext<MailContextType | undefined>(undefined);

export const MailProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MailMessage[]>(MOCK_MESSAGES);
  const [agents] = useState<Agent[]>(MOCK_AGENTS);
  const [currentFilter, setCurrentFilter] = useState<string | 'all'>('all');
  const [latestNotification, setLatestNotification] = useState<MailMessage | null>(null);

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
