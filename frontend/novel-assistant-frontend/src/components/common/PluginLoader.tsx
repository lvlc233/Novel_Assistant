"use client";

import { useEffect } from 'react';
import { useSlot } from '@/contexts/SlotContext';
import { getPluginsFromShop } from '@/services/pluginService';
import { logger } from '@/lib/logger';

/**
 * 负责加载插件配置并同步到插槽系统
 * 
 * 注释者: FrontendAgent(react)
 * 时间: 2026-03-04 12:30:00
 * 说明: 移除了硬编码注入逻辑，完全由后端返回的插件配置驱动界面渲染。
 */
export function PluginLoader() {
  const { syncPluginSlots } = useSlot();

  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const plugins = await getPluginsFromShop();
        
        // 直接同步插件配置，不再进行前端硬编码注入
        syncPluginSlots(plugins);
      } catch (error) {
        logger.error('Failed to load plugins:', error);
      }
    };

    loadPlugins();
  }, [syncPluginSlots]);

  return null;
}
