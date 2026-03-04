"use client";
import React from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { SlotRenderer } from '@/contexts/SlotContext';
import { Bell } from 'lucide-react';
import { SLOT_IDS } from '@/core/ui/schema';

export function TopNav() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isSidebarOpen, toggleSidebar } = useGlobalStore();

  return (
    <header className="h-16 bg-surface-white/80 backdrop-blur-md border-b border-border-primary px-4 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Breadcrumbs / Title / Toggle (Mobile) */}
      <div className="flex items-center gap-4">
        {/* Mobile Toggle - visible only on small screens if we had responsive design implemented */}
        {/* For now, relying on Sidebar's internal toggle or Global State */}
        
        {/* Breadcrumbs Slot */}
        <SlotRenderer slotId={SLOT_IDS.HEADER_BREADCRUMB} className="flex items-center text-sm text-text-secondary" />
        
        {/* Default Title if no breadcrumb */}
        {/* <h1 className="font-serif font-bold text-lg text-text-primary">Workspace</h1> */}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Slot for Global Actions (e.g. Save status, Export) */}
        <SlotRenderer slotId={SLOT_IDS.HEADER_ACTIONS} className="flex items-center gap-2 mr-2" />
      </div>
    </header>
  );
}
