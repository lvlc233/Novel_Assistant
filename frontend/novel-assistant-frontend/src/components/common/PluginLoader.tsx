"use client";

import { useEffect } from 'react';
import { useSlot } from '@/contexts/SlotContext';
import { getPluginsFromShop, PluginOperation, subscribeToPluginChanges } from '@/services/pluginService';
import { logger } from '@/lib/logger';
import { SLOT_IDS } from '@/core/ui/schema';

/**
 * 负责加载插件配置并同步到插槽系统
 */
export function PluginLoader() {
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
          const tags = (p as any).tags || []; // 兼容 tags 可能不存在的情况
          
          // 确保 operations 数组存在
          if (!p.operations) p.operations = [];

          // ----------------------------------------------------------------
          // 1. Mailbox Sidebar Injection (Request 2)
          // ----------------------------------------------------------------
          // 检查是否包含 'agent' 或 'Agent' 标签，或者是特定的 agent 插件
          const isAgent = tags.includes('agent') || tags.includes('Agent') || pId.includes('agent') || pName.includes('项目助手');
          
          if (isAgent) {
             // 注入到邮箱侧边栏
             if (!p.operations.some(op => op.ui_target === SLOT_IDS.MAILBOX_SIDEBAR)) {
                 p.operations.push({
                     name: 'agent_sidebar_item',
                     description: '邮箱侧边栏入口',
                     with_ui: ['AgentSidebarItem'],
                     ui_target: SLOT_IDS.MAILBOX_SIDEBAR,
                     is_stream: false,
                     input_schema: {
                        agentId: p.id,
                        name: p.name,
                        avatar: (p as any).avatar, // 假设 plugin 对象上有 avatar
                        role: (p as any).role || 'Assistant'
                     }
                 } as PluginOperation);
             }
          }

          // ----------------------------------------------------------------
          // 2. Core Plugins Logic
          // ----------------------------------------------------------------

          // 检查是否是邮箱插件
          if (['mail', 'agent_manager', 'agent管理插件'].some(k => pName.includes(k) || pId.includes(k))) {
             if (!p.operations.some(op => op.ui_target === SLOT_IDS.HEADER_ACTIONS)) {
                 p.operations.push({
                     name: 'mail_entry',
                     description: '邮箱入口',
                     with_ui: ['MailButton'],
                     ui_target: SLOT_IDS.HEADER_ACTIONS,
                     is_stream: false,
                     input_schema: {}
                 } as PluginOperation);
             }
          }

          // 检查是否是文档助手插件
          if (['doc_agent', 'document_helper', '文档助手'].some(k => pName.includes(k) || pId.includes(k))) {
             if (!p.operations.some(op => op.ui_target === SLOT_IDS.EDITOR_SIDEBAR)) {
                 p.operations.push({
                     name: 'editor_assistant',
                     description: '文档助手侧边栏',
                     with_ui: ['AIAssistant'],
                     ui_target: SLOT_IDS.EDITOR_SIDEBAR,
                     is_stream: false,
                     input_schema: {}
                 } as PluginOperation);
             }
          }

          // 检查是否是项目助手/快速输入插件 (Request 3)
          if (['project_helper', '项目助手', 'project_agent', 'ph_agent'].some(k => pName.includes(k) || pId.includes(k))) {
             
             // 注入到作品详情页底部 (Legacy)
             if (!p.operations.some(op => op.ui_target === SLOT_IDS.WORK_DETAIL_BOTTOM)) {
                 p.operations.push({
                     name: 'quick_input_bottom',
                     description: '底部快速输入',
                     with_ui: ['BottomInput'],
                     ui_target: SLOT_IDS.WORK_DETAIL_BOTTOM,
                     is_stream: false,
                     input_schema: {}
                 } as PluginOperation);
             }

             // 注入到首页 - 使用 ProjectChatInput 并绑定 call 操作
             if (!p.operations.some(op => op.ui_target === SLOT_IDS.HOME_MAIN)) {
                 p.operations.push({
                     name: 'home_chat_input',
                     description: '首页项目助手输入',
                     with_ui: ['ProjectChatInput'], // 使用专门的组件
                     ui_target: SLOT_IDS.HOME_MAIN,
                     is_stream: false,
                     input_schema: {
                        pluginId: p.id,
                        operationName: 'call', // 对应 python 中的 @operation(name="call")
                        pageId: 'home',
                        placeholder: '快速指令 / 询问 AI...'
                     }
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
