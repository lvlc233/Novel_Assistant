
// 仪表盘
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Settings, Plus, LayoutGrid, Sparkles, BarChart3, Database, Brain, Bot, FileEdit, Briefcase, Puzzle } from 'lucide-react';
import FeatureCard from './FeatureCard';
import QuickCreateMenu from './QuickCreateMenu';
import PluginManagerModal, { PluginType } from './PluginManagerModal';
import { logger } from '@/lib/logger';
import { getPlugins } from '@/services/pluginService';
import { PluginInstance } from '@/types/plugin';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260126-04
 * 创建时间: 2026-01-20 22:35
 * 更新时间: 2026-01-26 21:40
 * 更新记录:
 * - [2026-01-20 22:35:FE-REF-20260120-03: 在何处使用: 首页仪表盘；如何使用: 点击插件卡片展开扇形选择区；实现概述: 重构布局为 Fan Interaction，移除知识库入口以匹配设计稿。]
 * - [2026-01-25 15:30:FE-REF-20260125-01: 更新插件列表为实际业务模块（记忆、知识库、Agent）；添加点击跳转逻辑。]
 * - [2026-01-25 15:45:FE-REF-20260125-02: 修复滚动方向为横向；移除卡片旋转以修复渲染问题；点击卡片弹出模态框而非跳转。]
 * - [2026-01-25 16:30:FE-REF-20260125-03: 拆分 Agent 为文档助手和项目助手。]
 * - [2026-01-26 21:40:FE-REF-20260126-04: 对接后端插件列表接口 (GET /plugin)。]
 */

interface DashboardProps {
  onOpenSettings?: () => void;
}

// 默认系统插件映射（如果后端未返回或作为Fallback）
const SYSTEM_PLUGIN_MAP: Record<string, { icon: React.ReactNode, type: PluginType }> = {
    'memory_plugin': { icon: <Brain />, type: 'memory' },
    'knowledge_plugin': { icon: <Database />, type: 'knowledge' },
    'Agent管理插件': { icon: <Bot />, type: 'agent' }, 
    // Chinese Names Mapping
    '记忆': { icon: <Brain />, type: 'memory' },
    '知识库': { icon: <Database />, type: 'knowledge' },
    '项目助手': { icon: <Briefcase />, type: 'project_agent' },
    '文档创作助手': { icon: <FileEdit />, type: 'doc_agent' },
    // Fallback/Legacy mappings
    'agent_manager': { icon: <Bot />, type: 'agent' },
    'knowledge_base': { icon: <Database />, type: 'knowledge' },
    'doc_agent': { icon: <FileEdit />, type: 'doc_agent' },
    'project_agent': { icon: <Briefcase />, type: 'project_agent' },
};

const Dashboard: React.FC<DashboardProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPluginsExpanded, setIsPluginsExpanded] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginType | null>(null);
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateSelect = (type: 'blank' | 'template' | 'import') => {
    logger.debug('Dashboard selected create type:', type);
    setIsCreateMenuOpen(false);
    router.push('/editor');
  };

  const fetchPlugins = async () => {
      try {
          setIsLoadingPlugins(true);
          const data = await getPlugins();
          setPlugins(data);
      } catch (error) {
          logger.error('Failed to fetch plugins:', error);
      } finally {
          setIsLoadingPlugins(false);
      }
  };

  const handlePluginClick = () => {
    const nextState = !isPluginsExpanded;
    setIsPluginsExpanded(nextState);
    if (nextState && plugins.length === 0) {
        fetchPlugins();
    }
  };
  
  const handlePluginCardClick = (plugin: PluginInstance) => {
      // 尝试匹配系统插件类型
      const systemMap = SYSTEM_PLUGIN_MAP[plugin.manifest.name] || SYSTEM_PLUGIN_MAP[plugin.id];
      
      if (systemMap) {
          setSelectedPlugin(systemMap.type);
      } else {
          // 对于非系统内置的插件，暂时跳转到插件详情或列表页
          router.push('/plugins');
      }
  };

  // Horizontal scroll wheel handler
  const handleWheel = (e: React.WheelEvent) => {
    // Only intercept if we are in the expanded plugin area and scrolling vertically
    if (scrollContainerRef.current && isPluginsExpanded && e.deltaY !== 0) {
        // Prevent default browser vertical scroll if possible? 
        // React synthetic events don't support preventDefault on passive listeners easily, 
        // but here we are just translating the motion.
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
              color="bg-white"
              onClick={() => router.push('/works')}
            />
        </div>

        {/* 2. System Settings (Fixed Middle-Left) */}
        <div className={`transform transition-all duration-500 ${isPluginsExpanded ? '-translate-x-2 rotate-[-3deg]' : 'rotate-0 hover:-translate-y-2'}`}>
            <FeatureCard
              title="系统配置"
              icon={<Settings className="w-8 h-8" />}
              rotation="rotate-0"
              color="bg-white"
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
                        ? 'h-[340px] bg-white/40 backdrop-blur-md border-2 border-dashed border-border-primary/50' 
                        : 'h-[280px] bg-white shadow-xl group-hover:shadow-2xl border border-white/50 overflow-hidden'}
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
                        <LayoutGrid className="w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-serif font-bold text-gray-800">扩展功能</h3>
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
                            {isLoadingPlugins ? '加载中...' : `滑动切换 (${plugins.length})`}
                         </span>
                    </div>

                    {/* Scrollable Fan List */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-x-auto overflow-y-hidden flex items-center px-8 gap-8 scrollbar-hide cursor-grab active:cursor-grabbing snap-x"
                    >
                         {/* Plugin Cards */}
                         {plugins.map((plugin) => {
                             const systemMap = SYSTEM_PLUGIN_MAP[plugin.manifest.name] || SYSTEM_PLUGIN_MAP[plugin.id];
                             const icon = systemMap ? systemMap.icon : <Puzzle />;
                             
                             return (
                                 <div key={plugin.id} className="snap-center shrink-0 py-4">
                                    <FeatureCard
                                        title={plugin.manifest.name}
                                        icon={icon}
                                        color="bg-white"
                                        // Remove rotation to fix rendering issues and improve clarity
                                        rotation="rotate-0"
                                        onClick={() => handlePluginCardClick(plugin)}
                                    />
                                 </div>
                             );
                         })}
                         
                         {plugins.length === 0 && !isLoadingPlugins && (
                             <div className="flex items-center justify-center w-full text-text-secondary">
                                 暂无已启用的插件
                             </div>
                         )}

                         {/* Spacer for end of list */}
                         <div className="min-w-[20px] h-full" />
                    </div>
                </div>
            </div>
        </div>

      </div>

      <QuickCreateMenu isOpen={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} onSelect={handleCreateSelect} />
      
      {selectedPlugin && (
          <PluginManagerModal 
            type={selectedPlugin} 
            onClose={() => setSelectedPlugin(null)} 
          />
      )}

    </div>
  );
};

export default Dashboard;
