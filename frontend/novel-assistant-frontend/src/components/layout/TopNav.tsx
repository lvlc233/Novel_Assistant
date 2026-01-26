"use client";
import React from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { SlotRenderer } from '@/contexts/SlotContext';
import { Bell } from 'lucide-react';

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
        <SlotRenderer slotId="header-breadcrumb" className="flex items-center text-sm text-text-secondary" />
        
        {/* Default Title if no breadcrumb */}
        {/* <h1 className="font-serif font-bold text-lg text-text-primary">Workspace</h1> */}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Slot for Global Actions (e.g. Save status, Export) */}
        <SlotRenderer slotId="header-actions" className="flex items-center gap-2 mr-2" />

        <div className="h-6 w-px bg-border-primary mx-2"></div>

        <button className="p-2 rounded-full hover:bg-surface-hover text-text-secondary relative">
           <Bell className="w-5 h-5" />
           <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-white"></span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-border-primary cursor-pointer hover:ring-2 hover:ring-accent-primary/20 transition-all">
            {/* User Avatar Placeholder */}
            <div className="w-full h-full flex items-center justify-center bg-accent-secondary text-white font-bold text-xs">
                U
            </div>
        </div>
      </div>
    </header>
  );
}
