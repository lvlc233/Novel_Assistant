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
          
          // 检查是否是邮箱插件
          if (['mail', 'agent_manager', 'agent管理插件'].some(k => pName.includes(k) || pId.includes(k))) {
             // 确保有 operations 数组
             if (!p.operations) p.operations = [];
             // 检查是否已有 UI 配置
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
             if (!p.operations) p.operations = [];
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

          // 检查是否是项目助手/快速输入插件
          if (['project_helper', '项目助手', 'project_agent'].some(k => pName.includes(k) || pId.includes(k))) {
             if (!p.operations) p.operations = [];
             
             // 注入到作品详情页底部
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

             // 注入到首页
             if (!p.operations.some(op => op.ui_target === SLOT_IDS.HOME_MAIN)) {
                 p.operations.push({
                     name: 'home_chat_input',
                     description: '首页项目助手输入',
                     with_ui: ['BottomInput'], // 复用 BottomInput 组件
                     ui_target: SLOT_IDS.HOME_MAIN,
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
