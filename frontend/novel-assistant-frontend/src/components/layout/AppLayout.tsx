"use client";
import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SlotProvider } from '@/contexts/SlotContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SlotProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-surface-primary text-text-primary">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
             <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                 {children}
             </div>
          </main>
        </div>
      </div>
    </SlotProvider>
  );
}
