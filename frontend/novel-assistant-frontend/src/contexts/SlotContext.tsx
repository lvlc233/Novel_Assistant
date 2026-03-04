import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { ComponentRegistry } from '@/components/registry';
import { PluginShopItem } from '@/services/pluginService';

// Slot Item Definition
export interface SlotItem {
  id: string;
  component: ReactNode | ((props: unknown) => ReactNode);
  order?: number; // Sorting order
  props?: unknown;
}

interface SlotContextType {
  registerSlot: (slotId: string, item: SlotItem) => void;
  unregisterSlot: (slotId: string, itemId: string) => void;
  getSlotItems: (slotId: string) => SlotItem[];
  syncPluginSlots: (plugins: PluginShopItem[]) => void;
}

const SlotContext = createContext<SlotContextType | undefined>(undefined);

export function SlotProvider({ children }: { children: ReactNode }) {
  const [manualSlots, setManualSlots] = useState<Record<string, SlotItem[]>>({});
  const [pluginSlots, setPluginSlots] = useState<Record<string, SlotItem[]>>({});

  const registerSlot = useCallback((slotId: string, item: SlotItem) => {
    setManualSlots((prev) => {
      const currentItems = prev[slotId] || [];
      const existingIndex = currentItems.findIndex((i) => i.id === item.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...currentItems];
        updatedItems[existingIndex] = item;
        return {
          ...prev,
          [slotId]: updatedItems.sort((a, b) => (a.order || 0) - (b.order || 0)),
        };
      }

      return {
        ...prev,
        [slotId]: [...currentItems, item].sort((a, b) => (a.order || 0) - (b.order || 0)),
      };
    });
  }, []);

  const unregisterSlot = useCallback((slotId: string, itemId: string) => {
    setManualSlots((prev) => {
      const currentItems = prev[slotId] || [];
      return {
        ...prev,
        [slotId]: currentItems.filter((i) => i.id !== itemId),
      };
    });
  }, []);

  /**
   * 注释者: FrontendAgent(react)
   * 时间: 2026-03-04 10:00:00
   * 说明: 在何处使用: AppLayout 初始化插件时；如何使用: 传入插件列表解析 UI 配置；实现概述: 遍历插件 Operations，匹配 ui_target 和 ComponentRegistry，生成插槽项。
   */
  const syncPluginSlots = useCallback((plugins: PluginShopItem[]) => {
    const newPluginSlots: Record<string, SlotItem[]> = {};
    
    plugins.forEach(plugin => {
      // 仅处理已安装的插件
      if (!plugin.installed) return; 
      
      plugin.operations?.forEach(op => {
        // 必须有目标插槽和绑定的组件 Key
        if (op.ui_target && op.with_ui && op.with_ui.length > 0) {
          const slotId = op.ui_target;
          if (!newPluginSlots[slotId]) newPluginSlots[slotId] = [];
          
          op.with_ui.forEach(componentKey => {
            const Component = ComponentRegistry[componentKey];
            if (Component) {
              newPluginSlots[slotId].push({
                id: `${plugin.id}-${op.name}-${componentKey}`,
                // 这里直接渲染组件，如果需要传递 props 可以在这里扩展
                component: <Component />,
                order: 0 // 默认为 0，后续可从 operation 配置中读取
              });
            } else {
              console.warn(`[SlotContext] Component key "${componentKey}" not found in registry.`);
            }
          });
        }
      });
    });
    
    // 对每个插槽内的插件项进行排序 (如果需要)
    Object.keys(newPluginSlots).forEach(key => {
        newPluginSlots[key].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    setPluginSlots(newPluginSlots);
  }, []);

  const getSlotItems = useCallback((slotId: string) => {
    const manual = manualSlots[slotId] || [];
    const plugins = pluginSlots[slotId] || [];
    // 合并并排序，手动注册的默认在前还是在后？
    // 这里假设 order 决定一切，如果没有 order，manual 优先
    return [...manual, ...plugins].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [manualSlots, pluginSlots]);

  const contextValue = useMemo(() => ({
    registerSlot,
    unregisterSlot,
    getSlotItems,
    syncPluginSlots
  }), [registerSlot, unregisterSlot, getSlotItems, syncPluginSlots]);

  return (
    <SlotContext.Provider value={contextValue}>
      {children}
    </SlotContext.Provider>
  );
}

export function useSlot() {
  const context = useContext(SlotContext);
  if (!context) {
    throw new Error('useSlot must be used within a SlotProvider');
  }
  return context;
}

export const SlotRenderer = ({ 
  slotId, 
  className, 
  itemClassName,
  ...passThroughProps 
}: { 
  slotId: string, 
  className?: string, 
  itemClassName?: string,
  [key: string]: unknown 
}) => {
  const { getSlotItems } = useSlot();
  const items = getSlotItems(slotId);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item.id} className={itemClassName}>
          {React.isValidElement(item.component) 
            ? React.cloneElement(item.component as React.ReactElement, { ...item.props, ...passThroughProps })
            : (typeof item.component === 'function' 
                ? item.component({ ...item.props, ...passThroughProps }) 
                : item.component
              )
          }
        </div>
      ))}
    </div>
  );
};
