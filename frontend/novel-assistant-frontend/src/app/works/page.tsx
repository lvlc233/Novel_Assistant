"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppLayout } from '@/components/layout/AppLayout';
import { Work, Novel, KnowledgeBase } from '@/types/work';
import { getWorkList, createWork, deleteWork, updateWork, CreateWorkDto } from '@/services/workService';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { logger } from '@/lib/logger';

import { WorkCreationData } from '@/components/work-manager/CreateWorkCard';
import DocumentCarousel from '@/components/work-manager/DocumentCarousel';
import WorkPluginConfigModal from '@/components/work-manager/WorkPluginConfigModal';
import BottomInput from '@/components/common/BottomInput';

// userId is no longer needed for backend API but kept for function signature compatibility
const userId = "";

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260131-02
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-31 14:45
 * 更新记录:
 * - [2026-01-31 14:45:FE-REF-20260131-02: 采用通用 Work 类型，支持多作品类型列表展示。]
 * - [2026-01-31 14:25:FE-REF-20260131-01: 在何处使用: 作品列表页；如何使用: 替换Novel为Work terminology；实现概述: 重命名所有变量、状态、接口引用，对接新的WorkService。]
 * - [2026-01-26 20:45:FE-REF-20260126-02: 彻底移除 Mock 数据依赖，userId 传空（后端基于 Token）。]
 * - [2026-01-25 12:15:FE-REF-20260125-03: 集成知识库服务，移除 mock 数据。]
 */

export default function DocumentsPage() {
  const router = useRouter();
  
  const [works, setWorks] = useState<Work[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch works and knowledge bases
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // userId is not used by backend, passing empty string
        const [worksData, kbsData] = await Promise.all([
            getWorkList(""), 
            knowledgeBaseService.getKnowledgeBases()
        ]);

        setWorks(worksData);
        
        // Map KnowledgeBaseMeta to KnowledgeBase (for compatibility)
        const mappedKBs: KnowledgeBase[] = kbsData.map(kb => ({
            id: kb.id,
            name: kb.title,
            tags: [], // KnowledgeBaseMeta does not have tags
            content: kb.description || '' // Map description to content for preview
        }));
        setKnowledgeBases(mappedKBs);

      } catch (err: unknown) {
        logger.error('Error fetching data:', err);
        const message = err instanceof Error ? err.message : '连接服务器失败，请检查后端服务是否启动';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [pluginConfigWork, setPluginConfigWork] = useState<Novel | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const totalItems = works.length + 1; // works + 1 create card

      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % totalItems);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [works.length]);

  const handleSelectWork = (work: Work) => {
    // Navigate to work detail page
    logger.debug('Selected work:', work);
    router.push(`/works/${work.id}`);
  };

  const handleEditWork = async (work: Novel) => {
    logger.debug('Edit work:', work);
    
    try {
        const updatedWork = await updateWork({
            work_id: work.id,
            user_id: userId,
            work_name: work.title,
            work_status: work.status,
            work_cover_image_url: work.cover
        });
        
        setWorks(prev => prev.map(n => n.id === updatedWork.id ? updatedWork : n));
        logger.info('Work updated:', updatedWork.title);
    } catch (err) {
        logger.error('Failed to update work:', err);
        // Ideally show a toast
    }
  };

  const handleDeleteWork = async (id: string) => {
    try {
      await deleteWork(userId, id);
      setWorks(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      logger.error('Failed to delete work:', err);
    }
  };

  const handleCreateWork = async (data: WorkCreationData) => {
      try {
        logger.debug('Creating work with data:', data);
        
        // 构造 DTO
        const createDto: CreateWorkDto = {
          user_id: userId,
          work_name: data.title,
          work_summary: data.synopsis,
          work_cover_image_url: data.cover || undefined,
          kd_id_list: data.selectedKbIds,
          work_type: data.type,
          work_genre: data.genre,
          plugins: data.plugins
        };

        const newWork = await createWork(createDto);
        
        setWorks(prev => [...prev, newWork]);
        setIsCreating(false);
        // Navigate to the new work page
        router.push(`/works/${newWork.id}`);
      } catch (err: unknown) {
        logger.error('Failed to create work:', err);
        const message = err instanceof Error ? err.message : '创建失败';
        setError(`创建失败: ${message}`);
      }
  };

  const handleOpenPluginConfig = (work: Novel) => {
    setPluginConfigWork(work);
  };

  const handleSavePluginConfig = async (plugins: { id: string; enabled: boolean; config: any }[]) => {
    if (!pluginConfigWork) return;
    
    try {
      const updatedWork = await updateWork({
        work_id: pluginConfigWork.id,
        user_id: userId,
        plugins: plugins
      });
      
      setWorks(prev => prev.map(n => n.id === updatedWork.id ? updatedWork : n));
      logger.info('Plugins updated for work:', updatedWork.title);
    } catch (err) {
      logger.error('Failed to update plugins:', err);
      // Ideally show a toast notification here
      alert('插件配置保存失败，请重试');
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col relative overflow-hidden">
        
        {/* Main Content Area - Carousel */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0">
          {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-serif animate-pulse">正在加载作品列表...</p>
                <p className="text-gray-400 text-xs mt-2">首次加载可能需要唤醒后端服务，请稍候</p>
              </div>
          ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-red-500 text-xl font-bold mb-2">出错了</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                    重试
                </button>
              </div>
          ) : (
          <>
            <DocumentCarousel 
                works={works}
                onSelectWork={handleSelectWork}
                onCreateWork={handleCreateWork}
                onDeleteWork={handleDeleteWork}
                onEditWork={handleEditWork}
                onOpenPluginConfig={handleOpenPluginConfig}
                activeIndex={activeIndex}
                onIndexChange={setActiveIndex}
                isCreating={isCreating}
                onToggleCreating={setIsCreating}
                existingKnowledgeBases={knowledgeBases}
            />
            
            {pluginConfigWork && (
              <WorkPluginConfigModal 
                work={pluginConfigWork}
                onClose={() => setPluginConfigWork(null)}
                onSave={handleSavePluginConfig}
              />
            )}
          </>
          )}
        </div>

        <div className="h-24 shrink-0 flex items-center justify-center gap-4 px-4 pb-4 z-50 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl">
            <BottomInput 
              position="static"
              placeholder="快速指令 / 询问 AI..."
              onSubmit={(val) => logger.debug('Doc Input:', val)}
            />
          </div>
          <button 
             onClick={() => setIsCreating(true)}
             className="pointer-events-auto w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-lg mb-1"
          >
             <span className="text-xs font-bold">创建</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
