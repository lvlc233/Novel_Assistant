"use client";
import React, { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SlotProvider, useSlot } from '@/contexts/SlotContext';
import { getPluginsFromShop, PluginShopItem, PluginOperation, subscribeToPluginChanges } from '@/services/pluginService';
import { logger } from '@/lib/logger';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * 负责加载插件配置并同步到插槽系统
 */
function PluginLoader() {
  const { syncPluginSlots } = useSlot();

  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const plugins = await getPluginsFromShop();
        
        // 临时模拟后端配置增强逻辑 (直到后端完全支持返回 ui_target)
        // 遍历插件，如果发现是核心插件且没有配置 UI，则手动注入
        const enhancedPlugins = plugins.map(p => {
          const pName = p.name.toLowerCase();
          const pId = p.id.toLowerCase();
          
          // 检查是否是邮箱插件
          if (['mail', 'agent_manager', 'agent管理插件'].some(k => pName.includes(k) || pId.includes(k))) {
             // 确保有 operations 数组
             if (!p.operations) p.operations = [];
             // 检查是否已有 UI 配置
             if (!p.operations.some(op => op.ui_target === 'header-actions')) {
                 p.operations.push({
                     name: 'mail_entry',
                     description: '邮箱入口',
                     with_ui: ['MailButton'],
                     ui_target: 'header-actions',
                     is_stream: false,
                     input_schema: {}
                 } as PluginOperation);
             }
          }

          // 检查是否是文档助手插件
          if (['doc_agent', 'document_helper', '文档助手'].some(k => pName.includes(k) || pId.includes(k))) {
             if (!p.operations) p.operations = [];
             if (!p.operations.some(op => op.ui_target === 'editor-sidebar')) {
                 p.operations.push({
                     name: 'editor_assistant',
                     description: '文档助手侧边栏',
                     with_ui: ['AIAssistant'],
                     ui_target: 'editor-sidebar',
                     is_stream: false,
                     input_schema: {}
                 } as PluginOperation);
             }
          }

          // 检查是否是项目助手/快速输入插件
          if (['project_helper', '项目助手', 'project_agent'].some(k => pName.includes(k) || pId.includes(k))) {
             if (!p.operations) p.operations = [];
             if (!p.operations.some(op => op.ui_target === 'work-detail-bottom')) {
                 p.operations.push({
                     name: 'quick_input_bottom',
                     description: '底部快速输入',
                     with_ui: ['BottomInput'],
                     ui_target: 'work-detail-bottom',
                     is_stream: false,
                     input_schema: {}
                 } as PluginOperation);
             }
          }

          return p;
        });

        syncPluginSlots(enhancedPlugins);
      } catch (error) {
        logger.error('Failed to load plugins for layout:', error);
      }
    };

    loadPlugins();

    /**
     * 注释者: FrontendAgent(react)
     * 时间: 2026-03-04 10:30
     * 说明: 订阅插件变更事件，当插件安装/卸载/状态改变时自动刷新插槽。
     */
    const unsubscribe = subscribeToPluginChanges(loadPlugins);
    return unsubscribe;
  }, [syncPluginSlots]);

  return null;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SlotProvider>
      <PluginLoader />
      <div className="flex h-screen w-screen overflow-hidden bg-surface-primary text-text-primary">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
             <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                 {children}
             </div>
          </main>
        </div>
      </div>
    </SlotProvider>
  );
}
