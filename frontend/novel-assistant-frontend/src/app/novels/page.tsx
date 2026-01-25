"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Novel, KnowledgeBase } from '@/types/novel';
import { getNovelList, createNovel, CreateNovelDto } from '@/services/novelService';
import { logger } from '@/lib/logger';

import { NovelCreationData } from '@/components/novel-manager/CreateNovelCard';
import DocumentCarousel from '@/components/novel-manager/DocumentCarousel';
import BottomInput from '@/components/common/BottomInput';

import { userId } from '@/services/mock';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-01
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-20 21:40
 * 更新记录:
 * - [2026-01-20 21:40:FE-REF-20260120-01: 在何处使用: /novels 作品列表；如何使用: 进入页面自动拉取列表/创建作品；实现概述: 移除 console/alert，统一错误收口到页面状态与 logger。]
 */

export default function DocumentsPage() {
  const router = useRouter();
  
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch novels from API
  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setIsLoading(true);
    
        
        const data = await getNovelList(userId);
        setNovels(data);
      } catch (err: unknown) {
        logger.error('Error fetching novels:', err);
        const message = err instanceof Error ? err.message : '连接服务器失败，请检查后端服务是否启动';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const mockKnowledgeBases: KnowledgeBase[] = [
    {
      id: 'kb-1',
      name: '世界观设定',
      tags: ['设定', '背景'],
      content: '这是一个关于未来的世界观设定，包含星际旅行、外星种族和高科技武器的详细描述。人类已经殖民了银河系的大部分区域...'
    },
    {
      id: 'kb-2',
      name: '角色小传',
      tags: ['角色', '人物'],
      content: '主角张三，25岁，性格孤僻，擅长黑客技术。他在一次意外中获得了一个神秘的AI助手...'
    },
    {
      id: 'kb-3',
      name: '魔法系统',
      tags: ['魔法', '规则'],
      content: '本世界的魔法分为元素魔法和精神魔法。元素魔法包括火、水、风、土，精神魔法涉及心灵控制和幻术...'
    }
  ];

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

  const handleDeleteNovel = (id: string) => {
      setNovels(prev => prev.filter(n => n.id !== id));
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
          kd_id_list: data.selectedKbIds
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

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
        {/* 返回首页按钮 */}
        {/* TODO:或可以写为组件 */}
        <button 
            onClick={() => router.push('/home')}
            className="absolute top-8 left-8 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-all shadow-sm text-sm font-medium animate-slide-up"
            style={{ animationDelay: '0.1s' }}
        >
            ← 返回首页
        </button>

        {/* TODO:或可以改变为组件+ Suspense的形式*/}
       {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-serif animate-pulse">正在加载作品列表...</p>
            {/* 提示用户可能的冷启动延迟 */}
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
      // 核心列表：小说卡片carousel
       <DocumentCarousel 
          novels={novels}
          onSelectNovel={handleSelectNovel}
          onCreateNovel={handleCreateNovel}
          onDeleteNovel={handleDeleteNovel}
          onEditNovel={handleEditNovel}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          isCreating={isCreating}
          onToggleCreating={setIsCreating}
          existingKnowledgeBases={mockKnowledgeBases}
       />
       )}

        <div className="fixed bottom-12 left-0 right-0 z-50 flex items-end justify-center gap-4 px-4 pointer-events-none">
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
  );
}
