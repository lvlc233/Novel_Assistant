"use client";
import React, { useState } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import BottomInput from '@/components/common/BottomInput';
import SystemIntroduction from '@/components/dashboard/SystemIntroduction';
import SettingsModal from '@/components/settings/SettingsModal';

export default function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    // 整屏奶白背景，无滚动
    <div className="h-screen w-screen bg-surface-primary relative overflow-hidden flex flex-col">
      {/* Settings Modal - still needed for functionality, but triggered differently now (e.g. from Dashboard card) */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* 占满屏幕的 flex 容器，让子元素居中 */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[1920px] mx-auto">
          {/* 动画层 */}
          <div className="animate-fade-in w-full flex flex-col items-center justify-center gap-8 md:gap-12">
            <div className="w-full flex justify-center">
              {/* 仪表盘 */}
              <Dashboard onOpenSettings={() => setIsSettingsOpen(true)} />
            </div>
            <div className="w-full">
              {/* 系统介绍栏 */}
              <SystemIntroduction/>
            </div>
          </div>
          
          <div className="h-24 w-full shrink-0"></div> {/* Spacer for BottomInput */}
          
          <BottomInput 
            position="fixed"
            placeholder="快速指令 / 询问 AI..."
            onSubmit={(val) => console.log('Home Input:', val)}
          />
      </main>
    </div>
  );
}
