"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalStore } from '@/store/useGlobalStore';
import { SlotRenderer } from '@/contexts/SlotContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Puzzle, 
  Database,
  Brain,
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useGlobalStore();
  const pathname = usePathname();


  const NAV_ITEMS = [
    { name: '主页', path: '/home', icon: LayoutDashboard },
    { name: '文档', path: '/works', icon: BookOpen },
    { name: '插件管理', path: '/plugins', icon: Puzzle },
  ];

  return (
    <aside
      className={cn(
        "h-screen bg-surface-secondary border-r border-border-primary transition-all duration-300 ease-in-out flex flex-col relative z-20",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border-primary">
        <div className="flex items-center gap-2 overflow-hidden px-2">
            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold">N</span>
            </div>
            {isSidebarOpen && (
                <span className="font-serif font-bold text-lg text-text-primary whitespace-nowrap animate-fade-in">
                    Novel Assistant
                </span>
            )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                    isActive 
                        ? "bg-white text-accent-primary shadow-sm ring-1 ring-black/5 font-medium" 
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  )}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  {/* Active Indicator Strip */}
                  {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-primary rounded-r-full" />
                  )}
                  
                  <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-accent-primary" : "text-gray-500 group-hover:text-text-primary")} />
                  {isSidebarOpen && <span className="whitespace-nowrap text-sm">{item.name}</span>}
                </Link>
              </li>
            );
          })}
          
          {/* Plugin Slots in Sidebar */}
          <div className="mt-4 border-t border-border-primary pt-4">
             <SlotRenderer slotId="sidebar-nav" className="space-y-1" itemClassName="px-2" />
          </div>
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-2 border-t border-border-primary">
         <button 
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
         >
             {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
         </button>
      </div>
    </aside>
  );
}
