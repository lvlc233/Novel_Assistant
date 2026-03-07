import dynamic from 'next/dynamic';
import React from 'react';

// 动态导入组件以避免初始包过大
// 这些组件将通过后端配置动态加载到指定的插槽中

export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  // 邮箱入口按钮
  'MailButton': dynamic(() => import('@/components/mail/MailButton').then(mod => mod.MailButton), {
    loading: () => <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
  }),
  
  // 编辑器侧边栏助手
  'AIAssistant': dynamic(() => import('@/components/editor/AIAssistant'), {
    loading: () => <div className="w-64 h-full bg-gray-50 animate-pulse" />
  }),

  // 项目助手输入框
  'ProjectChatInput': dynamic(() => import('@/components/home/ProjectChatInput').then(mod => mod.ProjectChatInput), {
    loading: () => <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
  }),

  // 邮箱侧边栏代理项
  'AgentSidebarItem': dynamic(() => import('@/components/mail/AgentSidebarItem').then(mod => mod.AgentSidebarItem), {
    loading: () => <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
  }),

  // SDUI Components
  'WelcomeCard': dynamic(() => import('@/components/sdui/WelcomeCard').then(mod => mod.WelcomeCard), {
      loading: () => <div className="w-full h-32 bg-blue-100 rounded-xl animate-pulse" />
  }),
  'AgentBox': dynamic(() => import('@/components/sdui/AgentBox').then(mod => mod.AgentBox), {
      loading: () => <div className="w-full h-48 bg-gray-50 rounded-xl animate-pulse" />
  }),
  'WorkTypeSettings': dynamic(() => import('@/components/sdui/WorkTypeSettings').then(mod => mod.WorkTypeSettings), {
      loading: () => <div className="w-full h-48 bg-gray-50 rounded-xl animate-pulse" />
  }),
  'MemoryManager': dynamic(() => import('@/components/sdui/MemoryManager').then(mod => mod.MemoryManager), {
      loading: () => <div className="w-full h-48 bg-gray-50 rounded-xl animate-pulse" />
  }),
  'KnowledgeBaseManager': dynamic(() => import('@/components/sdui/KnowledgeBaseManager').then(mod => mod.KnowledgeBaseManager), {
      loading: () => <div className="w-full h-[600px] bg-gray-50 rounded-xl animate-pulse" />
  }),
  'ProjectSessionManager': dynamic(() => import('@/components/sdui/ProjectSessionManager').then(mod => mod.ProjectSessionManager), {
      loading: () => <div className="w-full h-[600px] bg-gray-50 rounded-xl animate-pulse" />
  }),
  'DocumentSessionManager': dynamic(() => import('@/components/sdui/DocumentSessionManager').then(mod => mod.DocumentSessionManager), {
      loading: () => <div className="w-full h-[600px] bg-gray-50 rounded-xl animate-pulse" />
  }),

  // Plugin Expand Container
  'PluginExpand': dynamic(() => import('@/components/dashboard/PluginExpand').then(mod => mod.PluginExpand)),
  'pluginexpand': dynamic(() => import('@/components/dashboard/PluginExpand').then(mod => mod.PluginExpand)),
  
  // Lowercase Compatibility
  'mailbutton': dynamic(() => import('@/components/mail/MailButton').then(mod => mod.MailButton)),
  'aiassistant': dynamic(() => import('@/components/editor/AIAssistant')),
  'assistant': dynamic(() => import('@/components/editor/AIAssistant')), // Mapping for /assistant path
  'projectchatinput': dynamic(() => import('@/components/home/ProjectChatInput').then(mod => mod.ProjectChatInput)),
  'agentsidebaritem': dynamic(() => import('@/components/mail/AgentSidebarItem').then(mod => mod.AgentSidebarItem)),
  
  'welcomecard': dynamic(() => import('@/components/sdui/WelcomeCard').then(mod => mod.WelcomeCard)),
  'agentbox': dynamic(() => import('@/components/sdui/AgentBox').then(mod => mod.AgentBox)),
  'worktypesettings': dynamic(() => import('@/components/sdui/WorkTypeSettings').then(mod => mod.WorkTypeSettings)),
  'workcreate': dynamic(() => import('@/components/sdui/WorkTypeSettings').then(mod => mod.WorkTypeSettings)), // Mapping for /works/workcreate path (assuming it maps to WorkTypeSettings or needs new component)
  'memorymanager': dynamic(() => import('@/components/sdui/MemoryManager').then(mod => mod.MemoryManager)),
  'knowledgebasemanager': dynamic(() => import('@/components/sdui/KnowledgeBaseManager').then(mod => mod.KnowledgeBaseManager)),
  'projectsessionmanager': dynamic(() => import('@/components/sdui/ProjectSessionManager').then(mod => mod.ProjectSessionManager)),
  'documentsessionmanager': dynamic(() => import('@/components/sdui/DocumentSessionManager').then(mod => mod.DocumentSessionManager)),

  // Agent Manager Plugin Components
  'PluginCard': dynamic(() => import('@/components/plugins/agent-manager/PluginCard').then(mod => mod.PluginCard)),
  'plugincard': dynamic(() => import('@/components/plugins/agent-manager/PluginCard').then(mod => mod.PluginCard)),
  
  'Info': dynamic(() => import('@/components/plugins/agent-manager/PluginDetailsInfo').then(mod => mod.PluginDetailsInfo)),
  'info': dynamic(() => import('@/components/plugins/agent-manager/PluginDetailsInfo').then(mod => mod.PluginDetailsInfo)),

  'EmailBoot': dynamic(() => import('@/components/plugins/agent-manager/EmailBoot').then(mod => mod.EmailBoot)),
  'emailboot': dynamic(() => import('@/components/plugins/agent-manager/EmailBoot').then(mod => mod.EmailBoot)),
};

export type ComponentRegistryKey = keyof typeof ComponentRegistry;
