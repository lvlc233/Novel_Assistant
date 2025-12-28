"use client";
import React, { useState } from 'react';
import {Plus } from 'lucide-react';
import { KnowledgeBase, Novel } from '@/types/novel';
import NovelCard from './NovelCard';
import CreateNovelCard from './CreateNovelCard';

import { NovelCreationData } from './CreateNovelCard';

  // Expose navigation methods via ref if needed, or controlled component.
  // Since we don't have a ref pattern set up, we'll lift the state up to the parent page.
  // However, for this task, the user asked to add key listener in the page.
  // But wait, the key listener needs to control the carousel.
  // So we should accept `activeIndex` and `onIndexChange` as props, or use `useImperativeHandle`.
  // Let's modify the component to be controlled or expose ref.
  // Easier: Make it controlled or lift state.
  // User asked to add BottomInput to page and "add click left/right key to switch".
  // So the page needs to control the index.
  
interface DocumentCarouselProps {
  novels: Novel[];
  onSelectNovel: (novel: Novel) => void;
  onCreateNovel: (data: NovelCreationData) => void;
  onDeleteNovel: (id: string) => void;
  onEditNovel?: (novel: Novel) => void;
  onOpenKnowledgeBase?: (novel: Novel) => void;
  // Controlled props
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  isCreating?: boolean;
  onToggleCreating?: (isCreating: boolean) => void;
  existingKnowledgeBases?: KnowledgeBase[];
}

// 文档卡片轮播组件
// TODO: 或考虑更细致的组件化
const DocumentCarousel: React.FC<DocumentCarouselProps> = ({ 
  // 文档列表
  novels, 
  // 选择文档回调
  onSelectNovel,
  // 创建文档回调
  onCreateNovel,
  // 删除文档回调
  onDeleteNovel,
  // 编辑文档回调
  onEditNovel,
  // 打开知识库回调
  onOpenKnowledgeBase,
  // 受控索引
  activeIndex: controlledIndex,
  // 索引变化回调
  onIndexChange,
  // 受控创建状态
  isCreating: controlledIsCreating,
  // 创建状态变化回调
  onToggleCreating,
  // 已存在知识库列表
  existingKnowledgeBases = []
}) => {
  // Items = Existing Novels + 1 "Create" Placeholder
  // Logic: We want to show 3 items at a time.
  // If we have 0 novels: Show [Create] in middle.
  // If we have 1 novel: Show [Create, Novel1, Create(repeat?)] or [Novel1, Create] ? 
  // Requirement: "Circular navigation... Existing novels + Create novel loop"
  
  const [internalIndex, setInternalIndex] = useState(0);
  const [internalIsCreating, setInternalIsCreating] = useState(false);

  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : internalIndex;

  const isCreatingControlled = controlledIsCreating !== undefined;
  const isCreating = isCreatingControlled ? controlledIsCreating : internalIsCreating;

  const handleToggleCreating = (value: boolean) => {
    if (isCreatingControlled && onToggleCreating) {
      onToggleCreating(value);
    } else {
      setInternalIsCreating(value);
    }
  };

  // Item type: { type: 'novel', data: Novel } | { type: 'create' }
  const items = [
    ...novels.map(n => ({ type: 'novel' as const, data: n })),
    { type: 'create' as const, data: null }
  ];

  const totalItems = items.length;

  const handlePrev = () => {
    const newIndex = (activeIndex - 1 + totalItems) % totalItems;
    if (isControlled && onIndexChange) {
      onIndexChange(newIndex);
    } else {
      setInternalIndex(newIndex);
    }
  };

  const handleNext = () => {
    const newIndex = (activeIndex + 1) % totalItems;
    if (isControlled && onIndexChange) {
      onIndexChange(newIndex);
    } else {
      setInternalIndex(newIndex);
    }
  };

  const getVisibleItems = () => {
    if (totalItems === 0) return []; // Should not happen as we always have 'create'
    
    // We want centered item at activeIndex.
    // Left item: activeIndex - 1
    // Right item: activeIndex + 1
    const leftIndex = (activeIndex - 1 + totalItems) % totalItems;
    const rightIndex = (activeIndex + 1) % totalItems;
    
    // Return array of indices to render
    return [leftIndex, activeIndex, rightIndex];
  };

  const visibleIndices = getVisibleItems();

  // 3D Style Helpers
  const getCardStyle = (position: 'left' | 'center' | 'right') => {
    const baseStyle = "transition-all duration-500 absolute top-1/2 transform -translate-y-1/2";
    
    switch (position) {
      case 'left':
        return `${baseStyle} left-[5%] scale-75 opacity-60 blur-[1px] -rotate-y-12 z-10 cursor-pointer`;
      case 'center':
        return `${baseStyle} left-1/2 -translate-x-1/2 scale-100 opacity-100 z-30`;
      case 'right':
        return `${baseStyle} right-[5%] scale-75 opacity-60 blur-[1px] rotate-y-12 z-10 cursor-pointer`;
    }
  };

  if (isCreating) {
    return (
      // 单个卡片
      <div className="flex items-center justify-center w-full h-[600px]">
        <CreateNovelCard 
          onCancel={() => handleToggleCreating(false)} 
          onCreate={(data) => {
            onCreateNovel(data);
            handleToggleCreating(false);
          }}
          existingKnowledgeBases={existingKnowledgeBases}
        />
      </div>
    );
  }
  //  不存在卡片时候的情况?
  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden perspective-[1200px]">
        {/* Title */}
        <h2 className="absolute top-10 text-3xl font-serif text-accent-primary tracking-widest z-40">
            你的文档
        </h2>

        {/* Navigation Arrows */}
        <button 
            onClick={handlePrev}
            className="absolute left-10 z-50 p-4 rounded-full hover:bg-black/5 transition-colors group"
        >
            <svg 
              className="w-12 h-12 text-black group-hover:scale-110 transition-transform" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
               <path d="M14 7l-5 5 5 5V7z" />
            </svg>
        </button>

        <button 
            onClick={handleNext}
            className="absolute right-10 z-50 p-4 rounded-full hover:bg-black/5 transition-colors group"
        >
            <svg 
              className="w-12 h-12 text-black group-hover:scale-110 transition-transform" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
               <path d="M10 17l5-5-5-5v10z" />
            </svg>
        </button>

        {/* Carousel Items */}
        <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
            {totalItems === 1 ? (
                 // Only "Create" card exists
                 <div className={getCardStyle('center')}>
                    <CreateCardPlaceholder onClick={() => handleToggleCreating(true)} />
                 </div>
            ) : (
                visibleIndices.map((itemIndex, i) => {
                    const position = i === 0 ? 'left' : i === 1 ? 'center' : 'right';
                    const item = items[itemIndex];
                    
                    // Don't render left/right if total items < 3 to avoid duplication visual glitches if desired,
                    // but for circular loop with 2 items, we might see duplicates. 
                    // For simplicity, we render what the math says.
                    
                    // Specific handling for 2 items case: 
                    // If total=2, Left is same as Right. We should avoid rendering same key twice?
                    // React key needs to be unique.
                    
                    return (
                        <div 
                            key={`${itemIndex}-${position}`}
                            className={getCardStyle(position)}
                            onClick={() => {
                                if (position === 'left') handlePrev();
                                if (position === 'right') handleNext();
                                if (position === 'center' && item.type === 'novel') onSelectNovel(item.data!);
                            }}
                        >
                            {item.type === 'novel' ? (
                                <NovelCard 
                                    novel={item.data!} 
                                    isActive={position === 'center'}
                                    onEdit={onEditNovel}
                                    onDelete={onDeleteNovel}
                                    onOpenKnowledgeBase={onOpenKnowledgeBase}
                                />
                            ) : (
                                <CreateCardPlaceholder onClick={() => {
                                    if (position === 'center') handleToggleCreating(true);
                                }} />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};

// Simple Placeholder for the "Create" card in the carousel
const CreateCardPlaceholder = ({ onClick }: { onClick: () => void }) => (
    <div 
        onClick={onClick}
        className="
            w-64 h-80 bg-surface-white rounded-2xl border-2 border-dashed border-gray-300 
            flex flex-col items-center justify-center cursor-pointer 
            hover:border-black hover:bg-gray-50 transition-all shadow-sm hover:shadow-xl
        "
    >
        <Plus className="w-16 h-16 text-gray-800 mb-4" strokeWidth={1.5} />
        <span className="font-serif text-lg text-gray-600">创建你新小说</span>
    </div>
);

export default DocumentCarousel;
