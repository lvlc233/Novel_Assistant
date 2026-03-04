"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { PluginShopItem } from '@/services/pluginService';
import { parsePluginOperations } from '@/core/ui/parser';

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

  const getSlotItems = useCallback((slotId: string) => {
    const manual = manualSlots[slotId] || [];
    const plugin = pluginSlots[slotId] || [];
    return [...manual, ...plugin].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [manualSlots, pluginSlots]);

  /**
   * 注释者: FrontendAgent(react)
   * 时间: 2026-03-04 10:00:00
   * 说明: 在何处使用: AppLayout 初始化插件时；如何使用: 传入插件列表解析 UI 配置；实现概述: 使用 parsePluginOperations 解析插件配置并更新插槽状态。
   */
  const syncPluginSlots = useCallback((plugins: PluginShopItem[]) => {
    const newPluginSlots = parsePluginOperations(plugins);
    setPluginSlots(newPluginSlots);
  }, []);

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
