
// 仪表盘
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Settings, Plus, LayoutGrid, Sparkles, BarChart3, Database } from 'lucide-react';
import FeatureCard from './FeatureCard';
import QuickCreateMenu from './QuickCreateMenu';
import { logger } from '@/lib/logger';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-03
 * 创建时间: 2026-01-20 22:35
 * 更新时间: 2026-01-20 22:35
 * 更新记录:
 * - [2026-01-20 22:35:FE-REF-20260120-03: 在何处使用: 首页仪表盘；如何使用: 点击插件卡片展开扇形选择区；实现概述: 重构布局为 Fan Interaction，移除知识库入口以匹配设计稿。]
 */

interface DashboardProps {
  onOpenSettings?: () => void;
}

// 模拟插件数据
const PLUGINS = [
    { id: 'writer', name: 'Writer Agent', icon: <Sparkles className="w-6 h-6" />, type: 'system', color: 'bg-accent-primary text-white' },
    { id: 'reviewer', name: 'Reviewer', icon: <FileText className="w-6 h-6" />, type: 'system', color: 'bg-accent-secondary text-white' },
    { id: 'marketing', name: 'Marketing', icon: <BarChart3 className="w-6 h-6" />, type: 'custom', color: 'bg-surface-white' },
    { id: 'data', name: 'Data Analyst', icon: <Database className="w-6 h-6" />, type: 'custom', color: 'bg-surface-white' },
    { id: 'character', name: 'Character Bot', icon: <Sparkles className="w-6 h-6" />, type: 'custom', color: 'bg-surface-white' },
    { id: 'translator', name: 'Translator', icon: <FileText className="w-6 h-6" />, type: 'custom', color: 'bg-surface-white' },
    { id: 'coder', name: 'Code Assistant', icon: <Settings className="w-6 h-6" />, type: 'custom', color: 'bg-surface-white' },
];

const Dashboard: React.FC<DashboardProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPluginsExpanded, setIsPluginsExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateSelect = (type: 'blank' | 'template' | 'import') => {
    logger.debug('Dashboard selected create type:', type);
    setIsCreateMenuOpen(false);
    router.push('/editor');
  };

  const handlePluginClick = () => {
    setIsPluginsExpanded(!isPluginsExpanded);
  };

  // Horizontal scroll wheel handler
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current && isPluginsExpanded) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto p-4 relative justify-center">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-primary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Interaction Area */}
      <div className="flex items-center justify-center gap-6 md:gap-10 transition-all duration-500 ease-in-out w-full">
        
        {/* 1. File Manager (Fixed Left) */}
        <div className={`transform transition-all duration-500 ${isPluginsExpanded ? '-translate-x-4 rotate-[-6deg]' : '-rotate-6 hover:-translate-y-2'}`}>
            <FeatureCard
              title="作品管理"
              icon={<FileText className="w-8 h-8" />}
              rotation="rotate-0" // handled by parent wrapper
              color="bg-surface-white"
              onClick={() => router.push('/novels')}
            />
        </div>

        {/* 2. System Settings (Fixed Middle-Left) */}
        <div className={`transform transition-all duration-500 ${isPluginsExpanded ? '-translate-x-2 rotate-[-3deg]' : 'rotate-0 hover:-translate-y-2'}`}>
            <FeatureCard
              title="系统配置"
              icon={<Settings className="w-8 h-8" />}
              rotation="rotate-0"
              color="bg-surface-white"
              onClick={onOpenSettings}
            />
        </div>

        {/* 3. Plugins / Expansion Area */}
        <div 
            className={`
                relative group transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                ${isPluginsExpanded ? 'w-[780px] rotate-[2deg]' : 'w-[200px] rotate-6 hover:scale-105 hover:-translate-y-2 hover:z-10'}
            `}
        >
            {/* The "Card" container that expands */}
            <div 
                className={`
                    rounded-[24px] transition-all duration-500
                    ${isPluginsExpanded 
                        ? 'h-[340px] bg-surface-white/40 backdrop-blur-md border-2 border-dashed border-border-primary/50' 
                        : 'h-[280px] bg-surface-white shadow-xl group-hover:shadow-2xl border border-white/50 overflow-hidden'}
                `}
            >
                {/* Collapsed State Content: Single "Coming Soon / Plugins" Card Look */}
                <div 
                    className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300
                        ${isPluginsExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                    `}
                    onClick={handlePluginClick}
                >
                     <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4 text-accent-secondary">
                        <Plus className="w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-serif font-bold text-text-primary">插件+</h3>
                </div>

                {/* Expanded State Content: Fan Scroll Area */}
                <div 
                    className={`absolute inset-0 flex flex-col transition-opacity duration-500 delay-100
                        ${isPluginsExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                    `}
                >
                    {/* Header of Fan Area */}
                    <div 
                        className="h-12 px-6 flex items-center justify-between border-b border-border-primary/20 cursor-pointer hover:bg-surface-hover/30 transition-colors rounded-t-[24px]"
                        onClick={handlePluginClick}
                        title="点击收起"
                    >
                         <span className="font-serif font-bold text-text-primary flex items-center gap-2">
                            <LayoutGrid size={18} />
                            插件扩展区
                         </span>
                         <span className="text-xs text-text-secondary bg-surface-white/50 px-2 py-1 rounded-full border border-border-primary/20">
                            滑动切换 ({PLUGINS.length})
                         </span>
                    </div>

                    {/* Scrollable Fan List */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto flex items-center px-8 gap-8 scrollbar-hide cursor-grab active:cursor-grabbing snap-x"
                        onWheel={handleWheel}
                    >
                         {/* Add Plugin Button (First Item) */}
                         <div className="snap-center shrink-0 py-4">
                            <FeatureCard
                                title="添加插件"
                                icon={<Plus className="w-8 h-8" />}
                                color="bg-surface-white/80 border-2 border-dashed border-border-primary hover:border-accent-primary hover:text-accent-primary"
                                onClick={() => setIsCreateMenuOpen(true)}
                            />
                         </div>

                         {/* Plugin Cards */}
                         {PLUGINS.map((plugin, idx) => (
                             <div key={plugin.id} className="snap-center shrink-0 py-4">
                                <FeatureCard
                                    title={plugin.name}
                                    icon={plugin.icon}
                                    color={plugin.color}
                                    // Subtle rotation for organic feel in the list
                                    rotation={idx % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                                />
                             </div>
                         ))}
                         
                         {/* Spacer for end of list */}
                         <div className="min-w-[20px] h-full" />
                    </div>
                </div>
            </div>
        </div>

      </div>

      <QuickCreateMenu isOpen={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} onSelect={handleCreateSelect} />

    </div>
  );
};

export default Dashboard;
