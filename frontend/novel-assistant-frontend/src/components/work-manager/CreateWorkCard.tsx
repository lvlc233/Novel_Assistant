import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ChevronDown, Check, Sparkles, Book, ArrowLeft, Wand2 } from 'lucide-react';
import { KnowledgeBase } from '@/types/work';
import { getPlugins, invokePluginOperation } from '@/services/pluginService';

interface CreateWorkCardProps {
  onCancel: () => void;
  onCreate: (data: WorkCreationData) => void;
  existingKnowledgeBases?: KnowledgeBase[];
}

export interface WorkCreationData {
  title: string;
  synopsis?: string;
  cover?: File | null;
  selectedKbIds?: string[];
  type: string;
  genre: string;
  plugins?: { id: string; config: Record<string, unknown>; enabled: boolean }[];
}

//  创建作品卡片信息
const CreateWorkCard: React.FC<CreateWorkCardProps> = ({ 
  onCancel, 
  onCreate,
  existingKnowledgeBases = []
}) => {
  // Navigation State
  const [creationStep, setCreationStep] = useState<'type-selection' | 'configuration'>('type-selection');
  
  // Work Types State
  const [workTypes, setWorkTypes] = useState<{label: string, value: string}[]>([
    { label: "小说", value: "novel" } // Default fallback
  ]);

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    cover: null as File | null,
    selectedKbIds: [] as string[],
    type: '',
    genre: 'fantasy' // default genre
  });

  // Knowledge Base UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const plugins = await getPlugins();
        
        // Load Work Types from Plugin
        const workTypePlugin = plugins.find(p => p.name === "作品类型" && p.fromType === 'system');
        if (workTypePlugin) {
          const result = await invokePluginOperation(workTypePlugin.id, "get_work_type_list_in_work_create", {});
          if (result && result.info_type === "WorkTypeSelect" && Array.isArray(result.data)) {
             const types = result.data.map((item: any) => ({
                 label: item.name,
                 value: item.name // Use name as value for now
             }));
             if (types.length > 0) {
                 setWorkTypes(types);
             }
          }
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    loadData();
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

  const handleSubmit = () => {
    onCreate({
      ...formData,
      plugins: [] // No plugins configuration
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
               {workTypes.map(typeItem => (
                 <button
                   key={typeItem.value}
                   onClick={() => handleTypeSelect(typeItem.value)}
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
                   <span className="font-bold text-lg text-gray-700 group-hover:text-black">{typeItem.label}</span>
                   
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
             {/* Main Content */}
             <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Form Content */}
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

                {/* Footer Action */}
                <div className="h-16 border-t border-gray-100 flex items-center justify-between px-8 bg-gray-50/50 shrink-0">
                   <div className="text-xs text-gray-400">
                      请填写作品基础信息
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

export default CreateWorkCard;
