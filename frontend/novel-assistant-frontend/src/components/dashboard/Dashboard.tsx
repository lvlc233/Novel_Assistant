"use client";
// 仪表盘
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// 后面或者可以多加一个图标库的映射,先放着吧
import { FileText, Settings, LayoutGrid, Sparkles, Puzzle, X, Loader2 } from 'lucide-react';
import FeatureCard from './FeatureCard';
import QuickCreateMenu from './QuickCreateMenu';
import { logger } from '@/lib/logger';
import { getPluginsFromShop, registerShopPlugin, unregisterShopPlugin, PluginShopItem } from '@/services/pluginService';
import { PluginInstance } from '@/types/plugin';


interface DashboardProps {
  onOpenSettings?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenSettings }) => {
  const router = useRouter();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isPluginsExpanded, setIsPluginsExpanded] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState< PluginInstance | null>(null);
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopPlugins, setShopPlugins] = useState<PluginShopItem[]>([]);
  const [isLoadingShop, setIsLoadingShop] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [registeringShopId, setRegisteringShopId] = useState<string | null>(null);
  const [removingShopId, setRemovingShopId] = useState<string | null>(null);
  const [systemPluginIds, setSystemPluginIds] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // const handleCreateSelect = (type: 'blank' | 'template' | 'import') => {
  //   logger.debug('Dashboard selected create type:', type);
  //   setIsCreateMenuOpen(false);
  //   router.push('/editor');
  // };

  useEffect(() => {
    if (!isShopOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isShopOpen]);



  const mapShopItemToPlugin = (item: PluginShopItem): PluginInstance => {
      // 临时映射,后续应该直接使用 PluginInstance
      return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          status: item.installed ? 'enabled' : 'disabled',
          fromType: item.from_type as any, // 临时类型断言
          config: [],
          operations: (item.operations || []).map(op => ({
              ...op,
              inputParams: new Map(Object.entries(op.input_schema)), // 临时兼容 Map
          })) as any, // 临时断言，后续更新 Operation 类型定义
          
          // 兼容旧字段
          installedAt: new Date().toISOString(),
          manifest: {
              id: item.id,
              name: item.name,
              version: item.version,
              description: item.description || '',
              from_type: item.from_type,
          }
      };
  };

  const fetchRegistedPlugins = async () => {
      try {
          setIsLoadingPlugins(true);
          // 使用带缓存的方法获取插件列表
          const pluginsFromShop = await getPluginsFromShop();
          // 过滤出已安装的插件
          const installedPlugins = pluginsFromShop.filter((plugin) => plugin.installed);
          setPlugins(installedPlugins.map(mapShopItemToPlugin));
      } catch (error) {
          logger.error('Failed to fetch plugins:', error);
      } finally {
          setIsLoadingPlugins(false);
      }
  };

  useEffect(() => {
    fetchRegistedPlugins();
  }, []);

  const fetchShopPlugins = async () => {
      try {
        // 开启加载动画
          setIsLoadingShop(true);
          // 开启异常动画
          setShopError(null);
          // 获取市场插件
          const pluginsFromShop = await getPluginsFromShop();
          setShopPlugins(pluginsFromShop);
          const systemPluginIds = pluginsFromShop.
              filter(item => item.from_type === 'system'). // 1. 先过滤出系统插件
              map(item => item.id);                       // 2. 再从中提取 ID
          setSystemPluginIds(new Set(systemPluginIds));//这里后续或可以换为枚举
      } catch (error) {
          logger.error('Failed to fetch shop plugins:', error);
          setShopError('插件市场加载失败');
          setSystemPluginIds(new Set());
      } finally {
          setIsLoadingShop(false);
      }
  };

  // 打开插件市场的激活函数
  const handleOpenShop = () => {
      setIsShopOpen(true);
      if (shopPlugins.length === 0) {
        // 获取市场的插件
          fetchShopPlugins();
      }
  };

  const handleRegisterShopPlugin = async (pluginId: string) => {
      try {
          setRegisteringShopId(pluginId);
          await registerShopPlugin(pluginId);
          await fetchShopPlugins();
          // await fetchPlugins();
      } catch (error) {
          logger.error('Failed to register shop plugin:', error);
          setShopError('插件注册失败');
      } finally {
          setRegisteringShopId(null);
      }
  };

  const handleUnregisterShopPlugin = async (pluginId: string) => {
      try {
          setRemovingShopId(pluginId);
          await unregisterShopPlugin(pluginId);
          await fetchShopPlugins();
          // await fetchPlugins();
      } catch (error) {
          logger.error('Failed to unregister shop plugin:', error);
          setShopError('插件移除失败');
      } finally {
          setRemovingShopId(null);
      }
  };

  const handlePluginClick = () => {
    const nextState = !isPluginsExpanded;
    setIsPluginsExpanded(nextState);
  };

  const handlePluginCardClick = (plugin: PluginInstance) => {
      logger.debug('Dashboard handlePluginCardClick:', plugin);
      setSelectedPlugin(plugin);
      // TODO: 打开插件详情或配置
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
                         {plugins.map((plugin) => (
                             <div key={plugin.id} className="snap-center shrink-0 py-4">
                                <FeatureCard
                                    title={plugin.manifest.name}
                                    icon={<Puzzle className="w-8 h-8 text-accent-primary" />}
                                    color="bg-white"
                                    rotation="rotate-0"
                                    onClick={() => handlePluginCardClick(plugin)}
                                />
                             </div>
                         ))}
                         
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

        {/* 4. Plugin Market (Fixed Right) */}
        <div className={`transform transition-all duration-500 ${isPluginsExpanded ? 'translate-x-2 rotate-[4deg]' : 'rotate-3 hover:-translate-y-2'}`}>
            <FeatureCard
              title="插件市场"
              icon={<Sparkles className="w-8 h-8" />}
              rotation="rotate-0"
              color="bg-white"
              onClick={handleOpenShop}
            />
        </div>

      </div>

      {/* <QuickCreateMenu isOpen={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} onSelect={handleCreateSelect} /> */}

      {isShopOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent animate-fade-in">
          <div className="w-[960px] max-w-[92vw] h-[640px] max-h-[90vh] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-scale-up relative mx-4">
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-accent-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">插件市场</h2>
                  <p className="text-xs text-text-secondary">从商店注册插件并启用到系统</p>
                </div>
              </div>
              <button
                onClick={() => setIsShopOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {isLoadingShop && (
                <div className="flex items-center justify-center h-full text-text-secondary gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  加载插件市场中...
                </div>
              )}

              {!isLoadingShop && shopError && (
                <div className="text-center text-sm text-error bg-red-50 border border-red-100 rounded-lg py-3">
                  {shopError}
                </div>
              )}

              {!isLoadingShop && !shopError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {shopPlugins.map((plugin) => {
                    const isRegistering = registeringShopId === plugin.id;
                    const hasUpgrade = Boolean(plugin.version!=plugin.latest_version);
                    const isInstalled = Boolean(plugin.installed);
                    const canUpgrade = isInstalled && hasUpgrade;
                    const isRemoving = removingShopId === plugin.id;
                    const isSystem = systemPluginIds.has(plugin.id);
                    const buttonLabel = isRegistering
                      ? '处理中...'
                      : canUpgrade
                        ? '更新到系统'
                        : isInstalled
                          ? (isSystem ? '系统内置' : '已加入')
                          : '加入系统';
                    const isDisabled = isRegistering || (isInstalled && !canUpgrade) || (isInstalled && isSystem);
                    return (
                      <div
                        key={plugin.id}
                        className="bg-surface-white rounded-xl p-5 border border-border-primary shadow-sm flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold text-text-primary">{plugin.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                              <span>最新: {plugin.latest_version || plugin.version}</span>
                              {isInstalled && plugin.latest_version && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                  canUpgrade ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  当前: {plugin.version}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 text-accent-secondary flex items-center justify-center">
                            <Puzzle className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-3">
                          {plugin.description || '暂无插件描述'}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-3">
                          <div className="text-[11px] text-text-secondary">
                            {canUpgrade ? '检测到版本差异，可更新' : isInstalled ? '已加入系统' : '未加入系统'}
                          </div>
                          <div className={isInstalled ? 'flex items-center justify-between gap-2' : 'flex items-center'}>
                            <button
                              onClick={() => handleRegisterShopPlugin(plugin.id)}
                              disabled={isDisabled}
                              className={`px-4 py-2 text-xs rounded-lg transition-colors ${
                                isDisabled
                                  ? 'bg-surface-white text-text-secondary border border-border-primary cursor-not-allowed'
                                  : canUpgrade
                                    ? 'bg-warning text-surface-white hover:bg-warning/90'
                                    : 'bg-text-primary text-surface-white hover:bg-text-primary/90 border border-text-primary shadow-md min-w-[120px] text-sm font-semibold'
                              }`}
                            >
                              {buttonLabel}
                            </button>
                            {isInstalled && !isSystem && (
                              <button
                                onClick={() => handleUnregisterShopPlugin(plugin.id)}
                                disabled={isRegistering || isRemoving}
                                className={`px-4 py-2 text-xs rounded-lg transition-colors ${
                                  isRegistering || isRemoving
                                    ? 'bg-gray-100 text-text-secondary cursor-not-allowed'
                                    : 'bg-error/10 text-error hover:bg-error/20'
                                }`}
                              >
                                {isRemoving ? '移除中...' : '移除'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {shopPlugins.length === 0 && (
                    <div className="col-span-full text-center text-text-secondary py-12">
                      暂无可注册插件
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
{/*       
      {selectedPlugin && (
          // <PluginManagerModal 
          //   type={typeof selectedPlugin === 'string' ? selectedPlugin : 'agent'} 
          //   plugin={typeof selectedPlugin === 'object' ? selectedPlugin : undefined}
          //   onClose={() => setSelectedPlugin(null)} 
          // />
      )} */}

    </div>
  );
};

export default Dashboard;
