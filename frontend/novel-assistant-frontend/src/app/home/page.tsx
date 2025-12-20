"use client";
import React, { useState } from 'react';
import Dashboard from '@/components/Home/Dashboard';
import BottomInput from '@/components/base/BottomInput';
import SystemIntroduction from '@/components/Home/SystemIntroduction';
import SettingsModal from '@/components/Settings/SettingsModal';
import { Settings } from 'lucide-react';

export default function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    // 整屏奶白背景
    <div className="min-h-screen bg-surface-primary relative overflow-x-hidden">
      {/* Settings Button */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-6 right-8 z-50 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:scale-110 hover:shadow-md transition-all group"
      >
        <Settings className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
      </button>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* 占满屏幕的 flex 容器，让子元素居中 */}
      <main className="min-h-screen flex items-center justify-start flex-col pt-16 pb-24">
          {/* 动画层 */}
          <div className="animate-fade-in w-full">
            <div>
              {/* 仪表盘 */}
              <Dashboard onOpenSettings={() => setIsSettingsOpen(true)} />
            </div>
            <div>
              {/* 系统介绍栏 */}
              <SystemIntroduction/>
            </div>
          </div>
          <BottomInput 
            position="fixed"
            placeholder="快速指令 / 询问 AI..."
            onSubmit={(val) => console.log('Home Input:', val)}
            
          />
      </main>

      

    </div>
  );
}
