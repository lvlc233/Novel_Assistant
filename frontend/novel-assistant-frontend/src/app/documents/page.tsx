"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DocumentCarousel from '@/components/Document/DocumentCarousel';
import { Novel, KnowledgeBase } from '@/types/novel';
import { NovelCreationData } from '@/components/Document/CreateNovelCard';
import BottomInput from '@/components/base/BottomInput';

export default function DocumentsPage() {
  const router = useRouter();
  
  // Mock data matching the interface in types/novel.ts
  const [novels, setNovels] = useState<Novel[]>([
    {
      id: '1',
      title: '星际迷航：未知的边界',
      cover: '',
      synopsis: '在遥远的未来，人类探索宇宙的边缘...',
      wordCount: 12500,
      status: '连载中',
      updatedAt: '2023-10-24 14:30',
      createdAt: ''
    },
     {
       id: '2',
       title: '魔法学院的日常',
       cover: '',
       synopsis: '一个平凡少年进入魔法学院的故事...',
       wordCount: 56000,
       status: '完结',
       updatedAt: '2023-09-15 09:20',
       createdAt: ''
     },
    {
      id: '3',
      title: '赛博朋克：霓虹之夜',
      cover: '',
      synopsis: '在被霓虹灯覆盖的城市下，隐藏着巨大的阴谋...',
      wordCount: 3400,
      status: '断更',
      updatedAt: '2023-11-01 18:45',
      createdAt: ''
    }
  ]);

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
    console.log('Selected novel:', novel);
    router.push(`/documents/${novel.id}`);
  };

  const handleEditNovel = (novel: Novel) => {
    console.log('Edit novel:', novel);
    // Logic for editing novel metadata (maybe same page or modal?)
    // For now, go to detail page
    router.push(`/documents/${novel.id}`);
  };

  const handleDeleteNovel = (id: string) => {
      setNovels(prev => prev.filter(n => n.id !== id));
  };

  const handleCreateNovel = (data: NovelCreationData) => {
      console.log("Create novel", data);
      const newNovel: Novel = {
          id: Date.now().toString(),
          title: data.title,
          synopsis: data.synopsis,
          wordCount: 0,
          status: '连载中',
          createdAt: new Date().toLocaleDateString(),
          updatedAt: new Date().toLocaleString(),
          volumes: [],
          orphanChapters: []
      };
      setNovels([...novels, newNovel]);
      // Navigate to the new novel page
      router.push(`/documents/${newNovel.id}`);
  };

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
        {/* Optional Back Button */}
        <button 
            onClick={() => router.push('/home')}
            className="absolute top-8 left-8 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-all shadow-sm text-sm font-medium animate-slide-up"
            style={{ animationDelay: '0.1s' }}
        >
            ← 返回首页
        </button>

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

        <div className="fixed bottom-12 left-0 right-0 z-50 flex items-end justify-center gap-4 px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl">
            <BottomInput 
              position="static"
              placeholder="快速指令 / 询问 AI..."
              onSubmit={(val) => console.log('Doc Input:', val)}
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
