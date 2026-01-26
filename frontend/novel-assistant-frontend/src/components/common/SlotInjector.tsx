"use client";
import React, { useEffect, ReactNode } from 'react';
import { useSlot } from '@/contexts/SlotContext';

interface SlotInjectorProps {
  slotId: string;
  children: ReactNode;
  order?: number;
}

export function SlotInjector({ slotId, children, order }: SlotInjectorProps) {
  const { registerSlot, unregisterSlot } = useSlot();
  const id = React.useId();

  useEffect(() => {
    registerSlot(slotId, {
      id,
      component: children,
      order
    });
    return () => unregisterSlot(slotId, id);
  }, [slotId, registerSlot, unregisterSlot, children, order, id]); // children dependency might cause frequent re-registers if not memoized

  return null;
}
