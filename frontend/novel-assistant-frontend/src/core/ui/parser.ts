import { PluginShopItem } from '@/services/pluginService';
import { ComponentRegistry } from '@/components/registry';
import type { SlotItem } from '@/contexts/SlotContext';
import React from 'react';

/**
 * 解析 UI 路径
 * 输入: /applayout/header/actions/mailentry
 * 输出: { slotId: '/applayout/header/actions', componentKey: 'mailentry' }
 */
function parseUIPath(path: string): { slotId: string | null, componentKey: string } {
  // 如果不是路径格式（没有 /），则认为是直接的 Component Key，Slot ID 未知
  if (!path.includes('/')) {
      return { slotId: null, componentKey: path };
  }

  // 移除 query string
  const cleanPath = path.split('?')[0];
  const parts = cleanPath.split('/').filter(Boolean);
  
  if (parts.length < 2) {
      return { slotId: null, componentKey: parts[0] || '' };
  }

  // 假设最后一部分是 Component，前面是 Slot
  // 路径是 /applayout/header/actions/mailentry
  // Slot ID 应该是 /applayout/header/actions
  const componentKey = parts[parts.length - 1];
  const slotId = '/' + parts.slice(0, parts.length - 1).join('/');

  return { slotId, componentKey };
}

/**
 * 解析插件操作并转换为插槽项
 */
export function parsePluginOperations(plugins: PluginShopItem[]): Record<string, SlotItem[]> {
  const slots: Record<string, SlotItem[]> = {};

  plugins.forEach(plugin => {
    // 仅处理已安装的插件
    if (!plugin.installed) return; 

    plugin.operations?.forEach(op => {
      // 1. 确定目标 Slot
      let slotId = op.ui_target;

      // 2. 确定组件
      // with_ui 可能包含组件路径列表，如 ['/home/card/item'] 或简单的 Key ['MailButton']
      // 我们需要兼容两种格式
      op.with_ui?.forEach(uiPath => {
        const { slotId: derivedSlotId, componentKey } = parseUIPath(uiPath);
        
        // 如果 op.ui_target 为空，尝试从 with_ui 推导
        if (!slotId) {
            slotId = derivedSlotId;
        }

        // 如果还是没有 Slot ID，跳过
        if (!slotId) return;

        // 查找组件
        // 1. 尝试直接 Key 匹配
        let Component = ComponentRegistry[componentKey];
        // 2. 尝试小写匹配
        if (!Component) {
            const key = Object.keys(ComponentRegistry).find(k => k.toLowerCase() === componentKey.toLowerCase());
            if (key) Component = ComponentRegistry[key];
        }

        if (Component) {
          // 初始化 Slot 数组
          if (!slots[slotId]) slots[slotId] = [];

          slots[slotId].push({
            id: `${plugin.id}-${op.name}-${componentKey}`,
            // 这里直接渲染组件，如果需要传递 props 可以在这里扩展
            component: React.createElement(Component, op.input_schema), 
            order: 0, // 默认为 0，后续可从 operation 配置中读取
            props: op.input_schema
          });
        } else {
            console.warn(`[UIParser] Component key "${componentKey}" (from path "${uiPath}") not found in registry.`);
        }
      });
    });
  });

  // 排序
  Object.keys(slots).forEach(key => {
    slots[key].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return slots;
}
