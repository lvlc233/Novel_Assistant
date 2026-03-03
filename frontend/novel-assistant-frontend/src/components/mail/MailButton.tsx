
"use client";
import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { useMail } from '@/contexts/MailContext';
import { PluginFeatureFlags } from '@/services/pluginService';
import { logger } from '@/lib/logger';

export const MailButton: React.FC = () => {
  const { toggleMailbox, unreadCount } = useMail();
  const [featureFlags, setFeatureFlags] = useState<PluginFeatureFlags | null>(null);

  /**
   * 注释者: FrontendAgent(react)
   * 时间: 2026-02-23 21:44:00
   * 说明: 在何处使用: 全局邮箱入口按钮；如何使用: 根据插件加载结果决定显示；实现概述: 拉取插件市场状态并控制邮箱入口可见性。
   */
  // useEffect(() => {
  //   let isActive = true;
  //   const loadFlags = (force = false) => {
  //     getPluginFeatureFlags({ force })
  //       .then((flags) => {
  //         if (!isActive) return;
  //         setFeatureFlags(flags);
  //       })
  //       .catch((error) => {
  //         logger.error('MailButton plugin flags load failed', error);
  //         if (!isActive) return;
  //         setFeatureFlags({ quickInput: false, mail: false, docAssistant: false });
  //       });
  //   };
  //   loadFlags();
  //   /**
  //    * 注释者: FrontendAgent(react)
  //    * 时间: 2026-02-23 22:05:00
  //    * 说明: 在何处使用: 全局邮箱入口刷新；如何使用: 订阅插件变更事件并强制刷新；实现概述: 插件安装/移除后更新邮箱入口显示。
  //    */
  //   const unsubscribe = subscribePluginFeatureFlagsChanged(() => loadFlags(true));
  //   return () => {
  //     isActive = false;
  //     unsubscribe();
  //   };
  // }, []);

  const isMailEnabled = featureFlags?.mail ?? false;

  if (!isMailEnabled) {
    return null;
  }

  return (
    <button
      onClick={toggleMailbox}
      className="relative p-3 bg-white rounded-full shadow-sm hover:bg-white hover:scale-110 hover:shadow-md transition-all group z-50"
      aria-label="打开信箱"
    >
      <Mail className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
      
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
           {/* Optional: Show number if needed, but dot is cleaner for small badge */}
        </span>
      )}
    </button>
  );
};
