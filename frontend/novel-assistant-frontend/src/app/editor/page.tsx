"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DocumentEditor from '@/components/editor/DocumentEditor';
import AIAssistant from '@/components/editor/AIAssistant';
import {  PluginFeatureFlags } from '@/services/pluginService';
import { logger } from '@/lib/logger';

// Wrap content in Suspense for useSearchParams
function EditorContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId') || searchParams.get('initialChapterId'); // Support both for transition or just documentId
  const workId = searchParams.get('workId'); 
  
  const [isAiExpanded, setIsAiExpanded] = useState(true);
  const [featureFlags, setFeatureFlags] = useState<PluginFeatureFlags | null>(null);

  /**
   * 注释者: FrontendAgent(react)
   * 时间: 2026-02-23 21:44:00
   * 说明: 在何处使用: 编辑器文档助手侧栏；如何使用: 根据插件加载结果决定渲染；实现概述: 拉取插件市场状态并控制文档助手可见性。
   */
  // useEffect(() => {
  //   let isActive = true;
  //   const loadFlags = (force = false) => {
  //     getPluginFeatureFlags({ force })
  //       .then((flags) => {
  //         if (!isActive) return;
  //         setFeatureFlags(flags);
  //         if (!flags.docAssistant) {
  //           setIsAiExpanded(false);
  //         }
  //       })
  //       .catch((error) => {
  //         logger.error('EditorPage plugin flags load failed', error);
  //         if (!isActive) return;
  //         setFeatureFlags({ quickInput: false, mail: false, docAssistant: false });
  //         setIsAiExpanded(false);
  //       });
  //   };
  //   loadFlags();
  //   /**
  //    * 注释者: FrontendAgent(react)
  //    * 时间: 2026-02-23 22:05:00
  //    * 说明: 在何处使用: 编辑器插件状态刷新；如何使用: 订阅插件变更事件并强制刷新；实现概述: 插件安装/移除后更新文档助手显示。
  //    */
  //   const unsubscribe = subscribePluginFeatureFlagsChanged(() => loadFlags(true));
  //   return () => {
  //     isActive = false;
  //     unsubscribe();
  //   };
  // }, []);

  const isDocAssistantEnabled = featureFlags?.docAssistant ?? false;

  return (
    <div className="flex w-full h-screen bg-white overflow-hidden relative">
        {/* Left: AI Assistant Sidebar */}
        {isDocAssistantEnabled && (
          <div 
              className={`
                  h-full flex-shrink-0 z-20 
                  transition-all duration-300 ease-in-out overflow-hidden
                  ${isAiExpanded ? 'w-[400px]' : 'w-0'}
              `}
          >
              <div className="w-[400px] h-full">
                  <AIAssistant isExpanded={isAiExpanded} onToggle={() => setIsAiExpanded(!isAiExpanded)} />
              </div>
          </div>
        )}
        
        {/* Floating Toggle Button (When AI is collapsed) */}
        {isDocAssistantEnabled && !isAiExpanded && (
          <div className="absolute left-6 bottom-8 z-50">
              <button 
                onClick={() => setIsAiExpanded(true)}
                className="w-12 h-12 bg-black rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
                title="打开助手"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
          </div>
        )}

        {/* Right: Main Editor Area */}
        <div className="flex-1 h-full relative z-10 min-w-0">
            <DocumentEditor 
                isChatExpanded={isAiExpanded}
                documentId={documentId} 
                workId={workId}
            />
        </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
