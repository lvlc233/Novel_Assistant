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

  // // 底部快速输入框
  // 'BottomInput': dynamic(() => import('@/components/common/BottomInput'), {
  //   loading: () => <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
  // }),

  // 项目助手输入框
  'ProjectChatInput': dynamic(() => import('@/components/home/ProjectChatInput').then(mod => mod.ProjectChatInput), {
    loading: () => <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
  }),

  // 邮箱侧边栏代理项
  'AgentSidebarItem': dynamic(() => import('@/components/mail/AgentSidebarItem').then(mod => mod.AgentSidebarItem), {
    loading: () => <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
  }),

  // Agent Chat Box
  'AgentBox': dynamic(() => import('@/components/mail/AgentBox').then(mod => mod.AgentBox), {
      loading: () => <div className="w-[350px] h-[500px] bg-white rounded-xl shadow-xl animate-pulse" />
  }),

  // Plugin Expand Container
  'PluginExpand': dynamic(() => import('@/components/dashboard/PluginExpand').then(mod => mod.PluginExpand)),
  'pluginexpand': dynamic(() => import('@/components/dashboard/PluginExpand').then(mod => mod.PluginExpand)),
  
  // 兼容小写 Key (如果后端返回的是全小写路径)
  'mailbutton': dynamic(() => import('@/components/mail/MailButton').then(mod => mod.MailButton)),
  'aiassistant': dynamic(() => import('@/components/editor/AIAssistant')),
  // 'bottominput': dynamic(() => import('@/components/common/BottomInput')),
  'projectchatinput': dynamic(() => import('@/components/home/ProjectChatInput').then(mod => mod.ProjectChatInput)),
  'agentsidebaritem': dynamic(() => import('@/components/mail/AgentSidebarItem').then(mod => mod.AgentSidebarItem)),
  'agentbox': dynamic(() => import('@/components/mail/AgentBox').then(mod => mod.AgentBox)),
  
  // 快速创建菜单入口 (如果有的话，暂时保留占位)
  // 'QuickCreateEntry': dynamic(() => import('@/components/dashboard/QuickCreateMenu').then(mod => mod.QuickCreateEntry))

  // Agent Manager Plugin Components
  'PluginCard': dynamic(() => import('@/components/plugins/agent-manager/PluginCard').then(mod => mod.PluginCard)),
  'plugincard': dynamic(() => import('@/components/plugins/agent-manager/PluginCard').then(mod => mod.PluginCard)),
  
  'Info': dynamic(() => import('@/components/plugins/agent-manager/PluginDetailsInfo').then(mod => mod.PluginDetailsInfo)),
  'info': dynamic(() => import('@/components/plugins/agent-manager/PluginDetailsInfo').then(mod => mod.PluginDetailsInfo)),

  'EmailBoot': dynamic(() => import('@/components/plugins/agent-manager/EmailBoot').then(mod => mod.EmailBoot)),
  'emailboot': dynamic(() => import('@/components/plugins/agent-manager/EmailBoot').then(mod => mod.EmailBoot)),
};

export type ComponentRegistryKey = keyof typeof ComponentRegistry;
