import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ChevronDown, Check, Sparkles, Book, Settings, Puzzle, Info, Layout, ArrowLeft, Wand2 } from 'lucide-react';
import { KnowledgeBase } from '@/types/novel';
import { PluginInstance } from '@/types/plugin';
import { getPlugins } from '@/services/pluginService';

interface CreateNovelCardProps {
  onCancel: () => void;
  onCreate: (data: NovelCreationData) => void;
  existingKnowledgeBases?: KnowledgeBase[];
}

export interface NovelCreationData {
  title: string;
  synopsis?: string;
  cover?: File | null;
  selectedKbIds?: string[];
  type: string;
  genre: string;
  plugins?: { id: string; config: Record<string, unknown>; enabled: boolean }[];
}

const NOVEL_TYPES = [
  "小说"
];

const MOCK_MODELS = ["GPT-4", "Claude 3.5 Sonnet", "Gemini Pro", "DeepSeek V3"];

//  创建小说卡片信息
const CreateNovelCard: React.FC<CreateNovelCardProps> = ({ 
  onCancel, 
  onCreate,
  existingKnowledgeBases = []
}) => {
  // Navigation State
  const [creationStep, setCreationStep] = useState<'type-selection' | 'configuration'>('type-selection');
  const [configTab, setConfigTab] = useState<'basic' | 'plugins'>('basic');
  
  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    cover: null as File | null,
    selectedKbIds: [] as string[],
    type: '',
    genre: '玄幻'
  });

  // Plugins State
  const [availablePlugins, setAvailablePlugins] = useState<PluginInstance[]>([]);
  const [selectedPlugins, setSelectedPlugins] = useState<Set<string>>(new Set());
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, any>>({});
  const [activePluginId, setActivePluginId] = useState<string | null>(null);

  // Knowledge Base UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load plugins
    getPlugins().then(plugins => {
      setAvailablePlugins(plugins);
      // Auto-select system plugins
      const systemPlugins = plugins.filter(p => p.manifest.type === 'system').map(p => p.id);
      setSelectedPlugins(new Set(systemPlugins));
      
      // Initialize default configs
      const initialConfigs: Record<string, any> = {};
      plugins.forEach(p => {
        initialConfigs[p.id] = { model: "GPT-4", ...p.config };
      });
      setPluginConfigs(initialConfigs);
      
      if (plugins.length > 0) {
        setActivePluginId(plugins[0].id);
      }
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, cover: e.target.files[0] });
    }
  };

  const handleAddKB = (id: string) => {
    if (!formData.selectedKbIds.includes(id)) {
      setFormData(prev => ({ ...prev, selectedKbIds: [...prev.selectedKbIds, id] }));
    }
    setIsDropdownOpen(false);
  };

  const handleRemoveKB = (id: string) => {
    setFormData(prev => ({ ...prev, selectedKbIds: prev.selectedKbIds.filter(k => k !== id) }));
  };

  const togglePlugin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(selectedPlugins);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPlugins(newSet);
  };

  const updatePluginConfig = (id: string, key: string, value: unknown) => {
    setPluginConfigs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value
      }
    }));
  };

  const handleSubmit = () => {
    const pluginsData = Array.from(selectedPlugins).map(id => ({
      id,
      enabled: true,
      config: pluginConfigs[id] || {}
    }));

    onCreate({
      ...formData,
      plugins: pluginsData
    });
  };

  const handleTypeSelect = (type: string) => {
    setFormData({ ...formData, type });
    setCreationStep('configuration');
  };

  // Combine existing and created KBs
  const selectedKBs = existingKnowledgeBases.filter(kb => formData.selectedKbIds.includes(kb.id));

  return (
    <div className="
      relative w-[900px] h-[580px] bg-surface-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden
      flex flex-col animate-fade-in
    ">
      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-gray-50/50 shrink-0">
        <div className="flex items-center gap-4">
          {creationStep === 'configuration' && (
             <button 
               onClick={() => setCreationStep('type-selection')}
               className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
               title="返回类型选择"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
          )}
          <h2 className="font-serif font-bold text-lg text-black">
            {creationStep === 'type-selection' ? '选择作品类型' : '配置作品信息'}
          </h2>
        </div>
        
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* View 1: Type Selection */}
        {creationStep === 'type-selection' && (
          <div className="flex-1 p-8 overflow-y-auto animate-slide-in-right">
             <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
               {NOVEL_TYPES.map(type => (
                 <button
                   key={type}
                   onClick={() => handleTypeSelect(type)}
                   className="
                     group relative p-6 rounded-2xl border border-gray-200 bg-white
                     hover:border-black hover:shadow-lg transition-all duration-300
                     flex flex-col items-center justify-center gap-4
                     aspect-[4/3]
                   "
                 >
                   <div className="
                     w-12 h-12 rounded-full bg-gray-50 group-hover:bg-black group-hover:text-white
                     flex items-center justify-center transition-colors
                   ">
                     <Wand2 className="w-6 h-6" />
                   </div>
                   <span className="font-bold text-lg text-gray-700 group-hover:text-black">{type}</span>
                   
                   <div className="absolute inset-0 rounded-2xl border-2 border-black opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none" />
                 </button>
               ))}
             </div>
             <p className="text-center text-gray-400 mt-8 text-sm">选择一个类型以开始您的创作之旅</p>
          </div>
        )}

        {/* View 2: Configuration */}
        {creationStep === 'configuration' && (
          <div className="flex-1 flex w-full animate-slide-in-right">
             {/* Sidebar */}
             <div className="w-64 bg-gray-50/50 border-r border-gray-100 flex flex-col p-4 gap-2">
                <button
                  onClick={() => setConfigTab('basic')}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold
                    ${configTab === 'basic' 
                      ? 'bg-white text-black shadow-sm border border-gray-200' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <Layout className="w-4 h-4" />
                  基本信息
                </button>
                <button
                  onClick={() => setConfigTab('plugins')}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold
                    ${configTab === 'plugins' 
                      ? 'bg-white text-black shadow-sm border border-gray-200' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <Puzzle className="w-4 h-4" />
                  插件配置
                </button>

                <div className="mt-auto p-4 bg-blue-50 rounded-xl border border-blue-100 hidden">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
                    <Info className="w-3 h-3" />
                    当前类型
                  </div>
                  <div className="text-blue-900 font-serif font-bold text-lg">
                    {formData.type}
                  </div>
                </div>
             </div>

             {/* Main Content */}
             <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Tab: Basic Info */}
                {configTab === 'basic' && (
                  <div className="flex-1 p-8 overflow-y-auto animate-fade-in">
                     <div className="flex gap-8">
                       {/* Cover Upload */}
                       <div className="w-1/3 shrink-0">
                          <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">封面</label>
                          <div className="
                            w-full aspect-[2/3] rounded-xl border-2 border-dashed border-gray-300 
                            flex flex-col items-center justify-center cursor-pointer 
                            hover:border-black hover:bg-gray-50 transition-colors
                            relative group overflow-hidden bg-white shadow-sm
                          ">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept="image/*" />
          {formData.cover ? (
            <div className="w-full h-full relative group">
              <img 
                src={URL.createObjectURL(formData.cover)} 
                alt="Cover preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-white text-xs">点击更换</span>
              </div>
            </div>
          ) : (
                              <div className="text-center p-4">
                                <Upload className="w-8 h-8 text-gray-300 mx-auto group-hover:text-black transition-colors mb-2" />
                                <span className="text-xs text-gray-400 group-hover:text-black transition-colors font-serif block">
                                  上传封面
                                </span>
                              </div>
                            )}
                          </div>
                       </div>

                       {/* Form Fields */}
                       <div className="flex-1 space-y-6">
                          <div>
                             <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">作品名称</label>
                             <input 
                               type="text" 
                               className="w-full border-b-2 border-gray-200 focus:border-black outline-none bg-transparent py-2 font-serif text-2xl placeholder-gray-300 transition-colors"
                               value={formData.title}
                               onChange={(e) => setFormData({...formData, title: e.target.value})}
                               placeholder="请输入作品名称..."
                               autoFocus
                             />
                          </div>

                          <div>
                             <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">简介</label>
                             <div className="relative rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50/50 focus-within:bg-white focus-within:border-black transition-colors h-32">
                                <textarea 
                                  className="
                                    w-full h-full bg-transparent resize-none outline-none 
                                    text-sm leading-relaxed px-4 py-3 text-gray-700 font-serif
                                  "
                                  value={formData.synopsis}
                                  onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                                  placeholder="写一段引人入胜的简介..."
                                />
                             </div>
                          </div>

                          <div className="hidden">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500 block uppercase tracking-wider flex items-center gap-2">
                                  <Book className="w-3 h-3" />
                                  关联知识库
                                </label>
                              </div>

                              <div className="mb-3 relative" ref={dropdownRef}>
                                 <button 
                                   onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                   className="
                                     w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 
                                     text-sm text-gray-700 outline-none flex items-center justify-between
                                     hover:border-black transition-colors shadow-sm
                                   "
                                 >
                                   <span>{formData.selectedKbIds.length > 0 ? `已选择 ${formData.selectedKbIds.length} 个知识库` : '选择关联的知识库...'}</span>
                                   <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                 </button>
                                 
                                 {isDropdownOpen && (
                                   <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto p-1 animate-slide-down">
                                      {existingKnowledgeBases.length === 0 ? (
                                         <div className="p-3 text-center text-gray-400 text-xs">暂无可用知识库</div>
                                      ) : (
                                        existingKnowledgeBases.map(kb => (
                                          <div 
                                            key={kb.id}
                                            onClick={() => handleAddKB(kb.id)}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                          >
                                             <span className="text-sm text-gray-700">{kb.name}</span>
                                             {formData.selectedKbIds.includes(kb.id) && <Check className="w-3 h-3 text-green-500" />}
                                          </div>
                                        ))
                                      )}
                                   </div>
                                 )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {selectedKBs.map(kb => (
                                  <span key={kb.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 shadow-sm">
                                    {kb.name}
                                    <button onClick={() => handleRemoveKB(kb.id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                  </span>
                                ))}
                              </div>
                          </div>
                       </div>
                     </div>
                  </div>
                )}

                {/* Tab: Plugins */}
                {configTab === 'plugins' && (
                  <div className="flex-1 flex animate-fade-in overflow-hidden">
                     {/* Plugin List */}
                     <div className="w-[240px] border-r border-gray-100 flex flex-col bg-gray-50/30 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {availablePlugins.map(plugin => {
                          const isSelected = selectedPlugins.has(plugin.id);
                          const isActive = activePluginId === plugin.id;
                          return (
                            <div 
                              key={plugin.id}
                              onClick={() => setActivePluginId(plugin.id)}
                              className={`
                                p-3 rounded-xl border cursor-pointer transition-all relative group
                                ${isActive ? 'border-black bg-white shadow-md' : 'border-transparent hover:bg-white hover:border-gray-200'}
                              `}
                            >
                               <div className="flex items-start gap-3">
                                  <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                    ${isSelected ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}
                                  `}>
                                    <Puzzle className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <div className="flex items-center justify-between mb-0.5">
                                       <span className={`font-bold text-sm truncate ${isActive ? 'text-black' : 'text-gray-700'}`}>
                                         {plugin.manifest.name}
                                       </span>
                                       <div 
                                         onClick={(e) => togglePlugin(plugin.id, e)}
                                         className={`
                                           w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors
                                           ${isSelected ? 'bg-green-500' : 'bg-gray-300'}
                                         `}
                                       >
                                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isSelected ? 'translate-x-4' : ''}`} />
                                       </div>
                                     </div>
                                     <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                                       {plugin.manifest.description}
                                     </p>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                     </div>

                     {/* Plugin Config Panel */}
                     <div className="flex-1 p-6 overflow-y-auto">
                        {activePluginId ? (
                          <div className="max-w-lg mx-auto">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-gray-900">
                                  {availablePlugins.find(p => p.id === activePluginId)?.manifest.name} 配置
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${selectedPlugins.has(activePluginId) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {selectedPlugins.has(activePluginId) ? '已启用' : '未启用'}
                                </span>
                             </div>

                             {/* Plugin Description - Always Visible */}
                             <div className="p-4 bg-blue-50 rounded-xl flex gap-3 border border-blue-100 mb-6">
                                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="text-sm text-blue-900 font-medium">关于此插件</p>
                                  <p className="text-xs text-blue-700 leading-relaxed">
                                    {availablePlugins.find(p => p.id === activePluginId)?.manifest.description || "暂无描述"}
                                  </p>
                                </div>
                             </div>

                             {!selectedPlugins.has(activePluginId) ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                   <Settings className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                   <p className="text-gray-500 text-sm font-medium">启用此插件以配置更多选项</p>
                                   <button 
                                     onClick={() => togglePlugin(activePluginId)}
                                     className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:scale-105 transition-transform"
                                   >
                                     启用插件
                                   </button>
                                </div>
                             ) : (
                                <div className="space-y-6">
                                   <div className="space-y-4">
                                      <div>
                                         <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">模型选择</label>
                                         <select 
                                           className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-black transition-colors"
                                           value={pluginConfigs[activePluginId]?.model || "GPT-4"}
                                           onChange={(e) => updatePluginConfig(activePluginId, 'model', e.target.value)}
                                         >
                                            {MOCK_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                         </select>
                                      </div>

                                      <div>
                                         <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">功能开关</label>
                                         <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                              <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                checked={pluginConfigs[activePluginId]?.autoSave ?? true}
                                                onChange={(e) => updatePluginConfig(activePluginId, 'autoSave', e.target.checked)}
                                              />
                                              <span className="text-sm text-gray-700">自动保存生成内容</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                              <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                checked={pluginConfigs[activePluginId]?.notifications ?? false}
                                                onChange={(e) => updatePluginConfig(activePluginId, 'notifications', e.target.checked)}
                                              />
                                              <span className="text-sm text-gray-700">启用桌面通知</span>
                                            </label>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            请选择一个插件进行配置
                          </div>
                        )}
                     </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="h-16 border-t border-gray-100 flex items-center justify-between px-8 bg-gray-50/50 shrink-0">
                   <div className="text-xs text-gray-400">
                      {configTab === 'basic' ? '请填写作品基础信息' : '配置您的 AI 助手插件'}
                   </div>
                   <button 
                      onClick={handleSubmit}
                      disabled={!formData.title.trim()}
                      className={`
                        px-8 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all
                        ${formData.title.trim() 
                          ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                      `}
                   >
                      <Sparkles className="w-4 h-4" />
                      创建作品
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNovelCard;