"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Brain, Database, Bot, ChevronRight, Loader2, Calendar, Trash2, FileEdit, Briefcase, GripVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memoryService } from '@/services/memoryService';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { agentService } from '@/services/agentService';
import { projectAgentService, ProjectConfig, HistoryItem } from '@/services/projectAgentService';
import { KnowledgeBaseManager } from '@/components/knowledge-base/KnowledgeBaseManager';
import { logger } from '@/lib/logger';

import { ConfigRenderer } from './plugin-renderers/ConfigRenderer';
import { ProjectAgentRenderer } from './plugin-renderers/ProjectAgentRenderer';
import { ListItem, ConfigField, PluginInstance, StandardDataResponse, CardPayload, CardItem, ConfigPayload, RenderType } from '@/types/plugin';
import { invokePluginOperation } from '@/services/pluginService';

export type PluginType = 'memory' | 'knowledge' | 'agent' | 'doc_agent' | 'project_agent';

interface PluginManagerModalProps {
  type: PluginType;
  plugin?: PluginInstance;
  onClose: () => void;
}

interface ConfigItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  fetch: () => Promise<ListItem[]>;
  delete: (id: string) => Promise<void>;
  create: (data: any) => Promise<void>;
  route: string;
  formFields: { 
      name: string; 
      label: string; 
      type: string; 
      required?: boolean;
      readOnly?: boolean;
      description?: string;
  }[];
}

const PluginManagerModal: React.FC<PluginManagerModalProps> = ({ type, plugin, onClose }) => {
  const router = useRouter();
  const [items, setItems] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [panelRatio, setPanelRatio] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Dynamic Plugin State
  const [dynamicItems, setDynamicItems] = useState<CardItem[]>([]);
  const [currentView, setCurrentView] = useState<RenderType>('CARD');
  const [dynamicConfig, setDynamicConfig] = useState<ConfigPayload | null>(null);

  const [dynamicConfigValues, setDynamicConfigValues] = useState<Record<string, any>>({});
  
  // Project Agent State
  const [projectConfig, setProjectConfig] = useState<Record<string, any>>({
    model_name: '',
    base_url: '',
    api_key: '',
    is_action: false
  });
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null); // For history accordion
  const [regionEnabled, setRegionEnabled] = useState<Record<string, boolean>>({});
  const [historyData, setHistoryData] = useState<Record<string, HistoryItem[]>>({});

  // Configuration based on type
  const config: Record<PluginType, ConfigItem> = {
    memory: {
      title: '记忆管理',
      description: '管理系统的长期与短期记忆，支持记忆碎片的增删改查。',
      icon: <Brain className="w-6 h-6" />,
      color: 'text-accent-primary',
      bgColor: 'bg-gray-100',
      fetch: async () => {
        const data = await memoryService.getMemories();
        return data.map(m => ({
          id: m.memory_id,
          title: m.memory_name,
          subtitle: m.memory_description,
          tags: [],
          metadata: [{ key: 'create_at', value: new Date(m.create_at).toLocaleDateString() }]
        }));
      },
      delete: memoryService.deleteMemory,
      create: async (data: any) => {
          await memoryService.createMemory({
              memory_name: data.title,
              memory_description: data.description,
              memory_type: 'long', // Default
              memory_context: data.content
          });
      },
      route: '/memories',
      formFields: [
          { name: 'title', label: '名称', type: 'text', required: true },
          { name: 'description', label: '描述', type: 'textarea' },
          { name: 'content', label: '初始内容', type: 'textarea' }
      ]
    },
    knowledge: {
      title: '知识库',
      description: '维护外部知识库，支持上传文档、建立索引以供Agent检索。',
      icon: <Database className="w-6 h-6" />,
      color: 'text-accent-secondary',
      bgColor: 'bg-accent-secondary/10',
      fetch: async () => {
        const data = await knowledgeBaseService.getKnowledgeBases();
        return data.map(k => ({
          id: k.id,
          title: k.title,
          subtitle: k.description,
          tags: [],
          metadata: [{ key: 'create_at', value: k.create_at ? new Date(k.create_at).toLocaleDateString() : '' }]
        }));
      },
      delete: knowledgeBaseService.deleteKnowledgeBase,
      create: async (data: any) => {
          await knowledgeBaseService.createKnowledgeBase({
              name: data.title,
              description: data.description,
          });
      },
      route: '/knowledge-bases',
      formFields: [
          { name: 'title', label: '名称', type: 'text', required: true },
          { name: 'description', label: '描述', type: 'textarea' }
      ]
    },
    agent: {
      title: 'Agent 管理',
      description: '创建和配置自定义Agent，定义其人设、能力与交互模式。',
      icon: <Bot className="w-6 h-6" />,
      color: 'text-text-primary',
      bgColor: 'bg-surface-secondary',
      fetch: async () => {
        const data = await agentService.getAgents();
        return data.map(a => ({
          id: a.agent_id,
          title: a.agent_name,
          subtitle: a.agent_description,
          tags: [],
          metadata: [{ key: 'create_at', value: new Date(a.create_at).toLocaleDateString() }]
        }));
      },
      delete: agentService.deleteAgent,
      create: async (data: any) => {
          await agentService.createAgent({
              agent_name: data.title,
              agent_description: data.description,
              agent_type: 'custom',
              broadcast: false
          });
      },
      route: '/agents',
      formFields: [
          { name: 'title', label: '名称', type: 'text', required: true },
          { name: 'description', label: '描述', type: 'textarea' }
      ]
    },
    doc_agent: {
      title: '文档助手',
      description: '专注于文档编写与生成的助手，支持长文本生成与润色。',
      icon: <FileEdit className="w-6 h-6" />,
      color: 'text-text-primary',
      bgColor: 'bg-surface-secondary',
      fetch: async () => {
        const data = await agentService.getAgents();
        return data.map(a => ({
          id: a.agent_id,
          title: a.agent_name,
          subtitle: a.agent_description,
          tags: [],
          metadata: [{ key: 'create_at', value: new Date(a.create_at).toLocaleDateString() }]
        }));
      },
      delete: agentService.deleteAgent,
      create: async (data: any) => {
          await agentService.createAgent({
              agent_name: data.title,
              agent_description: data.description,
              agent_type: 'writer',
              broadcast: false
          });
      },
      route: '/agents',
      formFields: [
          { name: 'title', label: '名称', type: 'text', required: true },
          { name: 'description', label: '描述', type: 'textarea' }
      ]
    },
    project_agent: {
      title: '项目助手',
      description: '项目全局引导助手，为不同功能区域提供即时帮助与说明。',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'text-text-primary',
      bgColor: 'bg-surface-secondary',
      fetch: async () => {
        // Return static regions for project_agent with metadata
        return [
          { 
              id: 'dashboard', 
              title: '工作台首页', 
              subtitle: '项目概览与快捷入口',
              tags: [],
              metadata: [
                  { key: 'count', value: '5' },
                  { key: 'tokens', value: '450' },
                  { key: 'create_time', value: '2024-02-13' }
              ]
          },
          { 
              id: 'novel_create', 
              title: '小说创作', 
              subtitle: '核心创作区域，支持章节管理与编辑器',
              tags: [],
              metadata: [
                  { key: 'count', value: '12' },
                  { key: 'tokens', value: '1.2k' },
                  { key: 'create_time', value: '2024-02-13' }
              ]
          },
          { 
              id: 'character_manage', 
              title: '角色管理', 
              subtitle: '管理小说角色设定与关系图谱',
              tags: [],
              metadata: [
                  { key: 'count', value: '8' },
                  { key: 'tokens', value: '890' },
                  { key: 'create_time', value: '2024-02-12' }
              ]
          },
          { 
              id: 'outline_manage', 
              title: '大纲管理', 
              subtitle: '规划故事线与情节节点',
              tags: [],
              metadata: [
                  { key: 'count', value: '3' },
                  { key: 'tokens', value: '320' },
                  { key: 'create_time', value: '2024-02-10' }
              ]
          },
          { 
              id: 'world_setting', 
              title: '世界观设定', 
              subtitle: '构建小说世界背景与规则',
              tags: [],
              metadata: [
                  { key: 'count', value: '15' },
                  { key: 'tokens', value: '2.5k' },
                  { key: 'create_time', value: '2024-02-01' }
              ]
          }
        ];
      },
      delete: async () => {}, // Cannot delete regions
      create: async () => {}, // Cannot create regions
      route: '', // No route, handled in-place
      formFields: [
          { name: 'model_name', label: '模型', type: 'text', required: true },
          { name: 'base_url', label: 'API 地址', type: 'text', required: true },
          { name: 'api_key', label: 'API Key', type: 'password', required: true },
          { name: 'user_prompt', label: '系统提示词', type: 'textarea', required: false, description: 'Agent的系统设定' },
          { 
              name: 'is_action', 
              label: '允许操作', 
              type: 'boolean', 
              readOnly: true,
              description: '暂时不支持操作网页'
          }
      ]
    }
  };

  const currentConfig = config[type];

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (plugin && plugin.manifest.data_source_entry_point) {
          try {
            const response = await invokePluginOperation(
                plugin.id, 
                plugin.manifest.data_source_entry_point
            );
            // Verify if payload is StandardDataResponse structure
            const standardData = response.payload as unknown as StandardDataResponse;
            if (standardData.render_type === 'CARD') {
                const payload = standardData.payload as CardPayload;
                setDynamicItems(payload.cards);
                setItems(payload.cards.map(c => ({
                    id: c.id,
                    title: c.title,
                    subtitle: c.summary,
                    tags: c.tags,
                    metadata: []
                })));
                setCurrentView('CARD');
            }
          } catch (e) {
              console.error('Failed to load dynamic plugin data:', e);
          }
      } else {
          const data = await currentConfig.fetch();
          setItems(data);

          // Load extra data for project_agent
          if (type === 'project_agent') {
            try {
                // Load config
                const configData = await projectAgentService.getConfig();
                setProjectConfig(configData);

                // Load enabled resources
                const enabledResources = await projectAgentService.getEnabledResources();
                const enabledMap: Record<string, boolean> = {};
                // Initialize all items as disabled first, then enable if in list
                data.forEach(item => {
                     enabledMap[item.id] = enabledResources.includes(item.id);
                });
                setRegionEnabled(enabledMap);
            } catch (err) {
                console.error('Failed to load project agent extra data:', err);
            }
          }
      }
    } catch (error) {
      console.error(`Failed to load ${type} data:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type]);

  // Fetch history when expanded
  useEffect(() => {
      if (type === 'project_agent' && expandedRegion) {
           const fetchHistory = async () => {
               try {
                   const history = await projectAgentService.getHistory(expandedRegion);
                   setHistoryData(prev => ({ ...prev, [expandedRegion]: history }));
               } catch (error) {
                   console.error('Failed to fetch history', error);
               }
           };
           fetchHistory();
      }
  }, [expandedRegion, type]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, ratio)); // Allow full collapse
      setPanelRatio(clamped);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      // Auto snap logic
      if (panelRatio < 15) setPanelRatio(0);
      else if (panelRatio > 85) setPanelRatio(100);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, panelRatio]);

  const handleItemClick = async (id: string) => {
    if (plugin && currentView === 'CARD') {
        const card = dynamicItems.find(c => c.id === id);
        if (card && card.actions && card.actions.click) {
            const action = Array.isArray(card.actions.click) ? card.actions.click[0] : card.actions.click;
            if (action.type === 'invoke_operation' && action.operation) {
                try {
                    setIsLoading(true);
                    const response = await invokePluginOperation(plugin.id, action.operation, action.params);
                    const standardData = response.payload as unknown as StandardDataResponse;
                    if (standardData.render_type === 'CONFIG') {
                          const configPayload = standardData.payload as ConfigPayload;
                          setDynamicConfig(configPayload);
                          
                          // Initialize values from fields
                          const initialValues: Record<string, any> = {};
                          configPayload.fields.forEach(f => {
                              initialValues[f.key] = f.value;
                          });
                          setDynamicConfigValues(initialValues);
                          
                          setCurrentView('CONFIG');
                     }
                } catch (e) {
                    console.error('Action failed:', e);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        return;
    }

    if (type === 'project_agent') return;
    const path = `${currentConfig.route}/${id}`;
    router.push(path);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (type === 'project_agent') return; // Disable delete for project_agent
    if (!window.confirm('确定要删除该项吗？')) return;
    
    try {
        await currentConfig.delete(id);
        // Refresh list
        await loadData();
    } catch (error) {
        console.error('Delete failed:', error);
        alert('删除失败，请重试');
    }
  };

  // Convert formFields to ConfigFields for ConfigRenderer
  const configFields: ConfigField[] = currentConfig.formFields.map(field => ({
    key: field.name,
    label: field.label,
    description: field.description,
    value_type: field.type === 'boolean' ? 'boolean' : field.type === 'password' ? 'password' : field.type === 'textarea' ? 'textarea' : 'string',
    value: null,
    readOnly: field.readOnly,
    children: []
  }));

  // Special rendering for Knowledge Base using the new Manager
  if (type === 'knowledge') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="w-[90vw] max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-border-primary relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 p-2 bg-white hover:bg-surface-hover rounded-full transition-colors text-text-secondary hover:text-text-primary shadow-sm border border-border-primary"
                >
                    <X className="w-5 h-5" />
                </button>
                <KnowledgeBaseManager />
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-[90vw] max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-border-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-primary flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${currentConfig.bgColor} ${currentConfig.color}`}>
              {currentConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-serif font-bold text-text-primary">{currentConfig.title}</h2>
                  {type !== 'project_agent' && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-text-secondary border border-border-primary">
                      {isLoading ? '加载中...' : `共 ${items.length} 项`}
                    </span>
                  )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                  {type === 'project_agent' && <span className="text-text-tertiary">|</span>}
                  <p className="text-sm text-text-secondary">
                    {currentConfig.description}
                  </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary hover:text-text-primary"
             >
                <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div 
            ref={containerRef} 
            className="flex-1 min-h-0 grid bg-gray-50 overflow-hidden" 
            style={{ 
                gridTemplateColumns: `${panelRatio}% 8px ${100 - panelRatio}%`,
                transition: isDragging ? 'none' : 'grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
          {/* Left Panel: Configuration */}
          <div className="flex flex-col min-w-0 border-r border-border-primary bg-white h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-border-primary text-sm text-text-secondary bg-white">插件配置</div>
            <div className="flex-1 overflow-hidden relative">
                {type === 'project_agent' ? (
                    <ConfigRenderer 
                        fields={configFields}
                        configValues={projectConfig}
                        onConfigChange={(key, value) => setProjectConfig(prev => ({ ...prev, [key]: value }))}
                        onSave={async () => {
                             try {
                                 await projectAgentService.updateConfig(projectConfig as ProjectConfig);
                                 alert('配置已保存');
                             } catch (error) {
                                 console.error('Failed to save config', error);
                                 alert('保存失败');
                             }
                        }}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-text-tertiary">
                         <p>暂无可配置项</p>
                    </div>
                )}
            </div>
          </div>

          {/* Drag Handle */}
          <div
            className="relative cursor-col-resize bg-surface-secondary/70 hover:bg-accent-primary/10 transition-colors group flex items-center justify-center"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setIsDragging(true);
            }}
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-primary group-hover:bg-accent-primary/50 transition-colors" />
            <div className="z-10 bg-white border border-border-primary rounded-full p-0.5 shadow-sm text-text-tertiary group-hover:text-accent-primary group-hover:border-accent-primary transition-all">
                <GripVertical className="w-3 h-3" />
            </div>
          </div>

          {/* Right Panel: Content / History */}
          <div className="flex flex-col min-w-0 h-full overflow-hidden bg-gray-50">
            {type === 'project_agent' ? (
                // Project Agent List View (Accordion Style)
                <>
                    <div className="px-6 py-4 border-b border-border-primary text-sm text-text-secondary flex items-center justify-between bg-white">
                        <span>区域列表</span>
                        {/* No count badge here for project_agent as requested */}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <ProjectAgentRenderer 
                            items={items}
                            regionEnabled={regionEnabled}
                            expandedId={expandedRegion}
                            historyData={historyData}
                            onRegionToggle={async (id) => {
                                const newState = !regionEnabled[id];
                                // Optimistic update
                                setRegionEnabled(prev => ({ ...prev, [id]: newState }));
                                try {
                                    await projectAgentService.toggleResource(id, newState);
                                } catch (error) {
                                    // Revert on error
                                    setRegionEnabled(prev => ({ ...prev, [id]: !newState }));
                                    console.error('Failed to toggle resource', error);
                                }
                            }}
                            onExpand={(id) => setExpandedRegion(prev => prev === id ? null : id)}
                        />
                    </div>
                </>
            ) : (
                // Default List View (for other plugins)
                <>
                    <div className="px-6 py-4 border-b border-border-primary text-sm text-text-secondary flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                             {currentView === 'CONFIG' && (
                                 <button 
                                    onClick={() => setCurrentView('CARD')}
                                    className="p-1 hover:bg-gray-100 rounded-full mr-2"
                                 >
                                     <ChevronRight className="w-4 h-4 rotate-180" />
                                 </button>
                             )}
                             <span>{type === 'project_agent' ? '区域列表' : (currentView === 'CONFIG' ? '配置详情' : '插件内容')}</span>
                        </div>
                        <span className="text-xs text-text-tertiary">{isLoading ? '加载中...' : (currentView === 'CARD' ? `共 ${items.length} 项` : '')}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent-primary" />
                        <p className="text-lg">正在获取数据...</p>
                        </div>
                    ) : currentView === 'CONFIG' && dynamicConfig ? (
                         <ConfigRenderer 
                             fields={dynamicConfig.fields}
                             configValues={dynamicConfigValues}
                             onConfigChange={(key, value) => setDynamicConfigValues(prev => ({ ...prev, [key]: value }))}
                             onSave={dynamicConfig.actions?.save ? async () => {
                                 if (!plugin || !dynamicConfig.actions?.save) return;
                                 const action = dynamicConfig.actions.save;
                                 if (action.type === 'invoke_operation' && action.operation) {
                                     try {
                                         // Merge action params with form values
                                          const params = { ...action.params, ...dynamicConfigValues };
                                          await invokePluginOperation(plugin.id, action.operation, params);
                                          logger.info('Configuration saved successfully');
                                          // Refresh data?
                                      } catch (e) {
                                          logger.error('Configuration save failed', e);
                                      }
                                  }
                             } : undefined}
                         />
                    ) : items.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <div
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={`group relative p-6 bg-white hover:bg-white border border-border-primary hover:border-accent-primary hover:shadow-lg rounded-xl cursor-pointer transition-all duration-300 flex flex-col h-[200px]`}
                            >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                <h3 className="text-lg font-bold text-gray-900 truncate pr-8 font-serif">{item.title}</h3>
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="p-2 hover:bg-red-50 text-text-tertiary hover:text-red-500 rounded-full transition-colors"
                                        title="删除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed mb-4">
                                {item.subtitle || '暂无描述'}
                                </p>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-border-primary">
                                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                <Calendar className="w-3 h-3" />
                                <span>{item.metadata.find(m => m.key === 'create_at')?.value || ''}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent-primary transition-colors" />
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                        <p>暂无数据</p>
                        </div>
                    )}
                    </div>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginManagerModal;
