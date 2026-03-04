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

  // 底部快速输入框
  'BottomInput': dynamic(() => import('@/components/common/BottomInput'), {
    loading: () => <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
  })
  
  // 快速创建菜单入口 (如果有的话，暂时保留占位)
  // 'QuickCreateEntry': dynamic(() => import('@/components/dashboard/QuickCreateMenu').then(mod => mod.QuickCreateEntry))
};

export type ComponentRegistryKey = keyof typeof ComponentRegistry;
