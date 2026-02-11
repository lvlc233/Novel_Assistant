"use client";
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { KnowledgeBase, Work } from '@/types/work';
import WorkCard from './WorkCard';
import CreateWorkCard, { WorkCreationData } from './CreateWorkCard';

// Expose navigation methods via ref if needed, or controlled component.
// Since we don't have a ref pattern set up, we'll lift the state up to the parent page.
// However, for this task, the user asked to add key listener in the page.
// But wait, the key listener needs to control the carousel.
// So we should accept `activeIndex` and `onIndexChange` as props, or use `useImperativeHandle`.
// Easier: Make it controlled or lift state.
// User asked to add BottomInput to page and "add click left/right key to switch".
// So the page needs to control the index.

interface DocumentCarouselProps {
  works: Work[];
  onSelectWork: (work: Work) => void;
  onCreateWork: (data: WorkCreationData) => void;
  onDeleteWork: (id: string) => void;
  onEditWork?: (work: Work) => void;
  onOpenPluginConfig?: (work: Work) => void;
  // Controlled props
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  isCreating?: boolean;
  onToggleCreating?: (isCreating: boolean) => void;
  existingKnowledgeBases?: KnowledgeBase[];
}

// 作品卡片轮播组件
const DocumentCarousel: React.FC<DocumentCarouselProps> = ({ 
  // 作品列表
  works, 
  // 选择作品回调
  onSelectWork,
  // 创建作品回调
  onCreateWork,
  // 删除作品回调
  onDeleteWork,
  // 编辑作品回调
  onEditWork,
  // 打开插件配置回调
  onOpenPluginConfig,
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
  // Items = Existing Works + 1 "Create" Placeholder
  
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

  // Item type: { type: 'work', data: Work } | { type: 'create' }
  const items = [
    ...works.map(n => ({ type: 'work' as const, data: n })),
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

  // Animation Variants
  const variants = {
    center: {
      left: "50%",
      x: "-50%",
      y: "-50%",
      scale: 1,
      opacity: 1,
      zIndex: 30,
      rotateY: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    left: {
      left: "5%",
      x: "0%",
      y: "-50%",
      scale: 0.75,
      opacity: 0.6,
      zIndex: 10,
      rotateY: -12,
      filter: "blur(1px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    right: {
      left: "95%",
      x: "-100%",
      y: "-50%",
      scale: 0.75,
      opacity: 0.6,
      zIndex: 10,
      rotateY: 12,
      filter: "blur(1px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  if (isCreating) {
    return (
      // 单个卡片
      <div 
        className="flex items-center justify-center w-full h-[600px]"
        // Handle keyboard navigation inside the card if focused?
        // Actually, we want to stop propagation if user is typing in input
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <CreateWorkCard 
          onCancel={() => handleToggleCreating(false)} 
          onCreate={(data) => {
            onCreateWork(data);
            handleToggleCreating(false);
          }}
          existingKnowledgeBases={existingKnowledgeBases}
        />
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden perspective-[1200px]">
        {/* Title */}
        <h2 className="absolute top-10 text-3xl font-serif text-accent-primary tracking-widest z-40">
            你的作品
        </h2>

        {/* Navigation Arrows */}
        <button 
            onClick={handlePrev}
            className="absolute left-10 z-50 p-4 rounded-full transition-colors group"
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
            className="absolute right-10 z-50 p-4 rounded-full transition-colors group"
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
        <div className="relative w-full max-w-5xl h-full">
            {totalItems === 1 ? (
                 // Only "Create" card exists
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                    <CreateCardPlaceholder onClick={() => handleToggleCreating(true)} />
                 </div>
            ) : (
                visibleIndices.map((itemIndex, i) => {
                    const position = i === 0 ? 'left' : i === 1 ? 'center' : 'right';
                    const item = items[itemIndex];
                    
                    // Generate a stable but unique key
                    const baseKey = item.type === 'work' ? item.data!.id : 'create-card';
                    
                    // If an item appears multiple times (e.g. totalItems < 3), we must suffix the key
                    // to avoid React "duplicate key" errors.
                    // We suffix with the position index to ensure uniqueness for that specific slot.
                    const isDuplicate = visibleIndices.filter(idx => idx === itemIndex).length > 1;
                    const key = isDuplicate ? `${baseKey}-pos-${i}` : baseKey;
                    
                    return (
                        <motion.div 
                            key={key} // Use unique key to prevent React errors
                            className="absolute top-1/2 cursor-pointer w-72 flex items-center justify-center"
                            initial={false}
                            animate={position}
                            variants={variants as Variants}
                            onClick={() => {
                                if (position === 'left') handlePrev();
                                if (position === 'right') handleNext();
                                if (position === 'center' && item.type === 'work') onSelectWork(item.data!);
                            }}
                            style={{
                                transformStyle: "preserve-3d"
                            }}
                        >
                            {item.type === 'work' ? (
                                <WorkCard 
                                    work={item.data!} 
                                    isActive={position === 'center'}
                                    onEdit={onEditWork}
                                    onDelete={onDeleteWork}
                                    onOpenPluginConfig={onOpenPluginConfig}
                                />
                            ) : (
                                <CreateCardPlaceholder onClick={() => {
                                    if (position === 'center') handleToggleCreating(true);
                                }} />
                            )}
                        </motion.div>
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
            w-72 h-96 bg-surface-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden
            flex flex-col items-center justify-center cursor-pointer group
            transition-all duration-300 hover:shadow-2xl hover:border-gray-300
            relative
        "
    >
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', 
                 backgroundSize: '20px 20px' 
             }} 
        />
        
        <div className="
            w-20 h-20 rounded-full bg-gray-50 border border-gray-100 
            flex items-center justify-center mb-6
            group-hover:scale-110 group-hover:bg-black group-hover:border-black
            transition-all duration-500 ease-out
        ">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
        </div>
        
        <span className="font-serif text-xl text-gray-800 font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">
            创建新作品
        </span>
        <span className="text-xs text-gray-400 mt-2 font-serif opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
            点击开始创作之旅
        </span>
    </div>
);

export default DocumentCarousel;