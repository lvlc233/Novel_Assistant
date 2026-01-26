"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppLayout } from '@/components/layout/AppLayout';
import { Novel, KnowledgeBase } from '@/types/novel';
import { getNovelList, createNovel, deleteNovel, updateNovel, CreateNovelDto } from '@/services/novelService';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { logger } from '@/lib/logger';

import { NovelCreationData } from '@/components/novel-manager/CreateNovelCard';
import DocumentCarousel from '@/components/novel-manager/DocumentCarousel';
import NovelPluginConfigModal from '@/components/novel-manager/NovelPluginConfigModal';
import BottomInput from '@/components/common/BottomInput';

import { userId } from '@/services/mock';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260125-03
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-25 12:15
 * 更新记录:
 * - [2026-01-25 12:15:FE-REF-20260125-03: 集成知识库服务，移除 mock 数据。]
 * - [2026-01-25 12:00:FE-REF-20260125-02: 接入 AppLayout 统一布局。]
 * - [2026-01-20 21:40:FE-REF-20260120-01: 在何处使用: /novels 作品列表；如何使用: 进入页面自动拉取列表/创建作品；实现概述: 移除 console/alert，统一错误收口到页面状态与 logger。]
 */

export default function DocumentsPage() {
  const router = useRouter();
  
  const [novels, setNovels] = useState<Novel[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch novels and knowledge bases
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const [novelsData, kbsData] = await Promise.all([
            getNovelList(userId),
            knowledgeBaseService.getKnowledgeBases()
        ]);

        setNovels(novelsData);
        
        // Map KnowledgeBaseMeta to KnowledgeBase (for compatibility)
        const mappedKBs: KnowledgeBase[] = kbsData.map(kb => ({
            id: kb.id,
            name: kb.name,
            tags: kb.tags || [],
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
  const [pluginConfigNovel, setPluginConfigNovel] = useState<Novel | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const totalItems = novels.length + 1; // novels + 1 create card

      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % totalItems);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [novels.length]);

  const handleSelectNovel = (novel: Novel) => {
    // Navigate to novel detail page
    logger.debug('Selected novel:', novel);
    router.push(`/novels/${novel.id}`);
  };

  const handleEditNovel = (novel: Novel) => {
    logger.debug('Edit novel:', novel);
    // Logic for editing novel metadata (maybe same page or modal?)
    // For now, go to detail page
    router.push(`/novels/${novel.id}`);
  };

  const handleDeleteNovel = async (id: string) => {
    if (confirm('Are you sure you want to delete this novel?')) {
      try {
        await deleteNovel(userId, id);
        setNovels(prev => prev.filter(n => n.id !== id));
      } catch (err) {
        logger.error('Failed to delete novel:', err);
      }
    }
  };

  const handleCreateNovel = async (data: NovelCreationData) => {
      try {
        logger.debug('Creating novel with data:', data);
        
        // 构造 DTO
        const createDto: CreateNovelDto = {
          user_id: userId,
          novel_name: data.title,
          novel_summary: data.synopsis,
          // TODO: 处理封面图片上传，目前仅透传 null 或 URL
          // novel_cover_image_url: data.cover ? URL.createObjectURL(data.cover) : undefined,
          kd_id_list: data.selectedKbIds,
          novel_type: data.type,
          novel_genre: data.genre,
          plugins: data.plugins
        };

        const newNovel = await createNovel(createDto);
        
        setNovels(prev => [...prev, newNovel]);
        setIsCreating(false);
        // Navigate to the new novel page
        router.push(`/novels/${newNovel.id}`);
      } catch (err: unknown) {
        logger.error('Failed to create novel:', err);
        const message = err instanceof Error ? err.message : '创建失败';
        setError(`创建失败: ${message}`);
      }
  };

  const handleOpenPluginConfig = (novel: Novel) => {
    setPluginConfigNovel(novel);
  };

  const handleSavePluginConfig = async (plugins: { id: string; enabled: boolean; config: any }[]) => {
    if (!pluginConfigNovel) return;
    
    try {
      const updatedNovel = await updateNovel({
        novel_id: pluginConfigNovel.id,
        user_id: userId,
        plugins: plugins
      });
      
      setNovels(prev => prev.map(n => n.id === updatedNovel.id ? updatedNovel : n));
      logger.info('Plugins updated for novel:', updatedNovel.title);
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
                novels={novels}
                onSelectNovel={handleSelectNovel}
                onCreateNovel={handleCreateNovel}
                onDeleteNovel={handleDeleteNovel}
                onEditNovel={handleEditNovel}
                onOpenPluginConfig={handleOpenPluginConfig}
                activeIndex={activeIndex}
                onIndexChange={setActiveIndex}
                isCreating={isCreating}
                onToggleCreating={setIsCreating}
                existingKnowledgeBases={knowledgeBases}
            />
            
            {pluginConfigNovel && (
              <NovelPluginConfigModal 
                novel={pluginConfigNovel}
                onClose={() => setPluginConfigNovel(null)}
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
