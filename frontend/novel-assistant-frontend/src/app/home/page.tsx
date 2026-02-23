"use client";
import React, { useEffect, useState } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import BottomInput from '@/components/common/BottomInput';
import SystemIntroduction from '@/components/dashboard/SystemIntroduction';
import SettingsModal from '@/components/settings/SettingsModal';
import { getPluginFeatureFlags, PluginFeatureFlags, subscribePluginFeatureFlagsChanged } from '@/services/pluginService';
import { logger } from '@/lib/logger';

/**
 * 注释者: FrontendAgent(react)
 * 时间: 2026-02-23 22:12:00
 * 说明: 在何处使用: 首页底部快捷输入框；如何使用: 根据插件加载结果决定是否渲染；实现概述: 拉取插件市场状态并控制快捷输入框可见性。
 */

export default function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<PluginFeatureFlags | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadFlags = (force = false) => {
      getPluginFeatureFlags({ force })
        .then((flags) => {
          if (!isActive) return;
          setFeatureFlags(flags);
        })
        .catch((error) => {
          logger.error('HomePage plugin flags load failed', error);
          if (!isActive) return;
          setFeatureFlags({ quickInput: false, mail: false, docAssistant: false });
        });
    };
    loadFlags();
    /**
     * 注释者: FrontendAgent(react)
     * 时间: 2026-02-23 22:12:00
     * 说明: 在何处使用: 首页插件状态刷新；如何使用: 订阅插件变更事件并强制刷新；实现概述: 插件安装/移除后更新快捷输入框显示。
     */
    const unsubscribe = subscribePluginFeatureFlagsChanged(() => loadFlags(true));
    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const isQuickInputEnabled = featureFlags?.quickInput ?? false;

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
          
          {isQuickInputEnabled && (
            <BottomInput 
              position="fixed"
              placeholder="快速指令 / 询问 AI..."
              onSubmit={(val) => console.log('Home Input:', val)}
            />
          )}
      </main>
    </div>
  );
}
