import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

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
}

const SlotContext = createContext<SlotContextType | undefined>(undefined);

export function SlotProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Record<string, SlotItem[]>>({});

  const registerSlot = useCallback((slotId: string, item: SlotItem) => {
    setSlots((prev) => {
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
    setSlots((prev) => {
      const currentItems = prev[slotId] || [];
      return {
        ...prev,
        [slotId]: currentItems.filter((i) => i.id !== itemId),
      };
    });
  }, []);

  const getSlotItems = useCallback((slotId: string) => {
    return slots[slotId] || [];
  }, [slots]);

  const contextValue = useMemo(() => ({
    registerSlot,
    unregisterSlot,
    getSlotItems
  }), [registerSlot, unregisterSlot, getSlotItems]);

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

export const SlotRenderer = ({ slotId, className, itemClassName }: { slotId: string, className?: string, itemClassName?: string }) => {
  const { getSlotItems } = useSlot();
  const items = getSlotItems(slotId);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item.id} className={itemClassName}>
          {typeof item.component === 'function' ? item.component(item.props) : item.component}
        </div>
      ))}
    </div>
  );
};
