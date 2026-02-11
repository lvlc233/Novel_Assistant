import React, { useState, useEffect } from 'react';
import { X, Brain, Database, Bot, ChevronRight, Loader2, Calendar, Plus, Trash2, FileEdit, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memoryService } from '@/services/memoryService';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { agentService } from '@/services/agentService';
import { KnowledgeBaseManager } from '@/components/knowledge-base/KnowledgeBaseManager';

export type PluginType = 'memory' | 'knowledge' | 'agent' | 'doc_agent' | 'project_agent';

interface PluginManagerModalProps {
  type: PluginType;
  onClose: () => void;
}

interface ListItem {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  tags?: string[];
}

const PluginManagerModal: React.FC<PluginManagerModalProps> = ({ type, onClose }) => {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration based on type
  const config = {
    memory: {
      title: '记忆管理',
      icon: <Brain className="w-6 h-6" />,
      color: 'text-accent-primary',
      bgColor: 'bg-gray-100',
      fetch: async () => {
        const data = await memoryService.getMemories();
        return data.map(m => ({
          id: m.memory_id,
          title: m.memory_name,
          description: m.memory_description,
          meta: new Date(m.create_at).toLocaleDateString()
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
      icon: <Database className="w-6 h-6" />,
      color: 'text-accent-secondary',
      bgColor: 'bg-accent-secondary/10',
      fetch: async () => {
        const data = await knowledgeBaseService.getKnowledgeBases();
        return data.map(k => ({
          id: k.id,
          title: k.title,
          description: k.description,
          tags: [], // Tags removed from meta
          meta: k.create_at ? new Date(k.create_at).toLocaleDateString() : ''
        }));
      },
      delete: knowledgeBaseService.deleteKnowledgeBase,
      create: async (data: any) => {
          await knowledgeBaseService.createKnowledgeBase({
              name: data.title,
              description: data.description,
              // tags removed
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
      icon: <Bot className="w-6 h-6" />,
      color: 'text-text-primary',
      bgColor: 'bg-surface-secondary',
      fetch: async () => {
        const data = await agentService.getAgents();
        return data.map(a => ({
          id: a.agent_id,
          title: a.agent_name,
          description: a.agent_description,
          meta: new Date(a.create_at).toLocaleDateString()
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
      icon: <FileEdit className="w-6 h-6" />,
      color: 'text-text-primary',
      bgColor: 'bg-surface-secondary',
      fetch: async () => {
        const data = await agentService.getAgents();
        return data.map(a => ({
          id: a.agent_id,
          title: a.agent_name,
          description: a.agent_description,
          meta: new Date(a.create_at).toLocaleDateString()
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
      icon: <Briefcase className="w-6 h-6" />,
      color: 'text-text-primary',
      bgColor: 'bg-surface-secondary',
      fetch: async () => {
        const data = await agentService.getAgents();
        return data.map(a => ({
          id: a.agent_id,
          title: a.agent_name,
          description: a.agent_description,
          meta: new Date(a.create_at).toLocaleDateString()
        }));
      },
      delete: agentService.deleteAgent,
      create: async (data: any) => {
          await agentService.createAgent({
              agent_name: data.title,
              agent_description: data.description,
              agent_type: 'advisor',
              broadcast: false
          });
      },
      route: '/agents',
      formFields: [
          { name: 'title', label: '名称', type: 'text', required: true },
          { name: 'description', label: '描述', type: 'textarea' }
      ]
    }
  };

  const currentConfig = config[type];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await currentConfig.fetch();
      setItems(data);
    } catch (error) {
      console.error(`Failed to load ${type} data:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setView('list');
    setFormData({});
    loadData();
  }, [type]);

  const handleItemClick = (id: string) => {
    const path = `${currentConfig.route}/${id}`;
    router.push(path);
  };

  const handleEnterFullPage = () => {
    router.push(currentConfig.route);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  const handleCreateClick = () => {
      setView('create');
      setFormData({});
  };

  const handleBackToList = () => {
      setView('list');
      setFormData({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          await currentConfig.create(formData);
          setView('list');
          setFormData({});
          await loadData();
      } catch (error) {
          console.error('Create failed:', error);
          alert('创建失败，请重试');
      } finally {
          setIsSubmitting(false);
      }
  };

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
              <h2 className="text-2xl font-serif font-bold text-text-primary">{view === 'create' ? `新建${currentConfig.title}` : currentConfig.title}</h2>
              {view === 'list' && (
                  <p className="text-sm text-text-secondary mt-1">
                    {isLoading ? '加载中...' : `共 ${items.length} 项`}
                  </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
             {view === 'list' ? (
                 <button
                    onClick={handleCreateClick}
                    className="flex items-center gap-2 px-4 py-2 bg-text-primary text-surface-white rounded-lg hover:bg-text-secondary transition-colors shadow-sm"
                 >
                    <Plus className="w-4 h-4" />
                    <span>新建</span>
                 </button>
             ) : (
                 <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-secondary text-text-primary rounded-lg hover:bg-surface-hover transition-colors shadow-sm border border-border-primary"
                 >
                    <span>返回列表</span>
                 </button>
             )}
             <div className="w-px h-6 bg-border-primary mx-1"></div>
             <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-secondary hover:text-text-primary"
             >
                <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50">
          {view === 'list' ? (
              // List View
              isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent-primary" />
                  <p className="text-lg">正在获取数据...</p>
                </div>
              ) : items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="group relative p-6 bg-white hover:bg-white border border-border-primary hover:border-accent-primary hover:shadow-lg rounded-xl cursor-pointer transition-all duration-300 flex flex-col h-[200px]"
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
                        
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                            {item.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 text-xs bg-surface-secondary border border-border-primary rounded-full text-text-secondary">
                                {tag}
                                </span>
                            ))}
                            </div>
                        )}
                        
                        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">{item.description || '暂无描述'}</p>
                        </div>
                        
                        {item.meta && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-primary text-xs text-text-tertiary">
                            <Calendar className="w-3 h-3" />
                            <span>{item.meta}</span>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <div className={`p-6 rounded-full ${currentConfig.bgColor} mb-4 opacity-50`}>
                    {currentConfig.icon}
                  </div>
                  <p className="text-lg">暂无内容</p>
                  <button 
                    onClick={handleCreateClick}
                    className="mt-4 px-6 py-2 bg-surface-white border border-border-primary hover:bg-surface-hover rounded-lg text-sm text-text-primary transition-colors"
                  >
                    立即创建
                  </button>
                </div>
              )
          ) : (
              // Create Form View
              <div className="max-w-2xl mx-auto">
                  <form onSubmit={handleSubmit} className="space-y-6">
                      {currentConfig.formFields?.map((field) => (
                          <div key={field.name} className="space-y-2">
                              <label className="block text-sm font-medium text-text-primary">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {field.type === 'textarea' ? (
                                  <textarea
                                      name={field.name}
                                      value={formData[field.name] || ''}
                                      onChange={handleInputChange}
                                      required={field.required}
                                      className="w-full px-4 py-3 bg-surface-white border border-border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[120px] resize-y text-text-primary placeholder-text-tertiary"
                                      placeholder={`请输入${field.label}...`}
                                  />
                              ) : (
                                  <input
                                      type={field.type}
                                      name={field.name}
                                      value={formData[field.name] || ''}
                                      onChange={handleInputChange}
                                      required={field.required}
                                      className="w-full px-4 py-3 bg-surface-white border border-border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all text-text-primary placeholder-text-tertiary"
                                      placeholder={`请输入${field.label}...`}
                                  />
                              )}
                          </div>
                      ))}
                      
                      <div className="flex items-center justify-end gap-4 pt-6">
                          <button
                              type="button"
                              onClick={handleBackToList}
                              className="px-6 py-2.5 border border-border-primary rounded-xl text-text-secondary hover:bg-surface-hover transition-colors"
                          >
                              取消
                          </button>
                          <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-6 py-2.5 bg-text-primary text-surface-white rounded-xl hover:bg-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                              {isSubmitting ? '创建中...' : '确认创建'}
                          </button>
                      </div>
                  </form>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PluginManagerModal;
