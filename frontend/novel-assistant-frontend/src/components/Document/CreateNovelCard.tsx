import React, { useState, useRef, useEffect } from 'react';
import { Plus, Upload, X, ChevronDown, Check, ChevronLeft } from 'lucide-react';
import { KnowledgeBase } from '@/types/novel';

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
}

const CreateNovelCard: React.FC<CreateNovelCardProps> = ({ 
  onCancel, 
  onCreate,
  existingKnowledgeBases = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    cover: null as File | null,
    selectedKbIds: [] as string[]
  });

  // Knowledge Base UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingKB, setEditingKB] = useState<{content: string, isSaving: boolean, title: string} | null>(null);
  const [createdKBs, setCreatedKBs] = useState<KnowledgeBase[]>([]); // Store locally created KBs
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSaveNewKB = () => {
    if (!editingKB || !editingKB.title.trim()) return;
    
    const newKB: KnowledgeBase = {
      id: `new-${Date.now()}`,
      name: editingKB.title,
      tags: ['新建'],
      content: editingKB.content
    };

    setCreatedKBs(prev => [...prev, newKB]);
    setFormData(prev => ({ ...prev, selectedKbIds: [...prev.selectedKbIds, newKB.id] }));
    setEditingKB(null);
  };

  // Combine existing and created KBs
  const allKBs = [...existingKnowledgeBases, ...createdKBs];

  // Get selected KB objects
  const selectedKBs = allKBs.filter(kb => formData.selectedKbIds.includes(kb.id));

  return (
    <div className="
      relative w-[800px] h-[520px] bg-surface-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden
      flex animate-fade-in
    ">
      {/* Close Button */}
      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 z-50 p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>

      {/* Left Column: Novel Info */}
      <div className="w-1/2 p-8 flex flex-col border-r-2 border-black h-full relative">
        {/* Cover Upload */}
        <div className="mb-6">
          <div className="
            w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 
            flex flex-col items-center justify-center cursor-pointer 
            hover:border-black hover:bg-gray-50 transition-colors
            relative group overflow-hidden bg-white
          ">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
            {formData.cover ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 text-center p-2 break-all">
                {formData.cover.name}
              </div>
            ) : (
              <div className="text-center p-2">
                <span className="text-xs text-gray-400 group-hover:text-black transition-colors font-serif block mb-1">
                  上传你的封面
                </span>
                <Upload className="w-5 h-5 text-gray-300 mx-auto group-hover:text-black transition-colors" />
              </div>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-6 flex items-end gap-2">
           <label className="text-sm font-serif font-bold text-black whitespace-nowrap mb-1">小说名:</label>
           <input 
             type="text" 
             className="flex-1 border-b-2 border-gray-300 focus:border-black outline-none bg-transparent py-1 font-serif text-lg transition-colors"
             value={formData.title}
             onChange={(e) => setFormData({...formData, title: e.target.value})}
           />
        </div>

        {/* Synopsis Input */}
        <div className="flex-1 flex flex-col">
           <label className="text-sm font-serif font-bold text-black mb-2">简介:</label>
           <div className="flex-1 relative rounded-xl border-2 border-gray-200 overflow-hidden bg-white">
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{
                  backgroundImage: 'linear-gradient(transparent 27px, #e5e7eb 28px)',
                  backgroundSize: '100% 28px',
                  marginTop: '6px'
                }}
              />
              <textarea 
                className="
                  w-full h-full bg-transparent resize-none outline-none 
                  text-sm leading-[28px] px-4 py-1 text-gray-700 font-serif
                "
                style={{ lineHeight: '28px' }}
                value={formData.synopsis}
                onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
              />
           </div>
        </div>
      </div>

      {/* Right Column: Knowledge Base */}
      <div className="w-1/2 p-8 flex flex-col h-full relative bg-surface-primary/30">
        <h3 className="text-lg font-serif font-bold text-black mb-6">
           添加你的知识库
        </h3>

        {/* KB Editor Overlay */}
        {editingKB && (
          <div className="absolute inset-0 z-40 bg-white flex flex-col p-6 animate-fade-in">
             <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setEditingKB(null)} 
                  className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs font-bold">返回</span>
                </button>
                <h4 className="font-bold text-sm">新建知识库</h4>
                <div className="w-12"></div> {/* Spacer for alignment */}
             </div>
             
             {/* Lined Editor */}
             <div className="flex-1 relative border-2 border-gray-200 rounded-xl overflow-hidden mb-4 bg-white">
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  style={{
                    backgroundImage: 'linear-gradient(transparent 27px, #e5e7eb 28px)',
                    backgroundSize: '100% 28px',
                    marginTop: '6px'
                  }}
                />
                <textarea 
                  className="w-full h-full bg-transparent resize-none outline-none text-sm leading-[28px] px-4 py-1 font-serif"
                  value={editingKB.content}
                  onChange={(e) => setEditingKB({...editingKB, content: e.target.value})}
                  placeholder="输入知识库内容..."
                />
             </div>

             {/* Bottom Action Bar */}
             <div className="min-h-[44px] flex items-center justify-end">
               {!editingKB.isSaving ? (
                 <button 
                   onClick={() => setEditingKB({...editingKB, isSaving: true})}
                   className="px-6 py-2 bg-black text-white rounded-lg text-xs font-bold shadow-md hover:scale-105 transition-transform"
                 >
                   保存
                 </button>
               ) : (
                 <div className="flex items-center gap-2 w-full animate-fade-in">
                    <span className="text-xs font-bold whitespace-nowrap">保存为:</span>
                    <input 
                      type="text" 
                      className="flex-1 border-b border-black outline-none py-1 text-sm font-serif bg-transparent"
                      value={editingKB.title}
                      onChange={(e) => setEditingKB({...editingKB, title: e.target.value})}
                      placeholder="输入标题..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNewKB();
                        if (e.key === 'Escape') setEditingKB({...editingKB, isSaving: false});
                      }}
                    />
                    <button 
                      onClick={() => setEditingKB({...editingKB, isSaving: false})}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      title="取消"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleSaveNewKB}
                      disabled={!editingKB.title.trim()}
                      className={`
                        px-4 py-2 rounded-lg text-xs font-bold transition-all
                        ${editingKB.title.trim() 
                          ? 'bg-black text-white hover:bg-gray-800 shadow-md' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      确认
                    </button>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* Custom Dropdown */}
        <div className="mb-4 relative" ref={dropdownRef}>
           <button 
             onClick={() => setIsDropdownOpen(!isDropdownOpen)}
             className="
               w-full bg-white border-2 border-black rounded-lg px-4 py-2.5 
               text-sm font-medium text-black outline-none flex items-center justify-between
               shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all
             "
           >
             <span>从已有知识库中加载</span>
             <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
           </button>
           
           {isDropdownOpen && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto p-2 animate-slide-down">
                {existingKnowledgeBases.length === 0 ? (
                  <div className="p-3 text-center text-gray-400 text-xs">暂无知识库</div>
                ) : (
                  existingKnowledgeBases.map(kb => (
                    <div 
                      key={kb.id}
                      onClick={() => handleAddKB(kb.id)}
                      className="group p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all mb-1 last:mb-0 relative"
                    >
                       <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">{kb.name}</span>
                          {formData.selectedKbIds.includes(kb.id) && <Check className="w-3 h-3 text-green-500" />}
                       </div>
                       <div className="flex gap-1 mb-2">
                          {kb.tags.map(t => (
                            <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                       </div>
                       {/* Preview on hover/slide */}
                       <div className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed group-hover:text-gray-600">
                          {kb.content || "暂无内容预览..."}
                       </div>
                    </div>
                  ))
                )}
             </div>
           )}
        </div>

        {/* Selected KBs List (Tags) */}
        <div className="flex-1 overflow-y-auto p-1">
           <div className="flex flex-wrap gap-2 items-start">
              {selectedKBs.map(kb => (
                <div key={kb.id} className="group relative">
                   {/* Tag Item */}
                   <div className="
                     px-3 py-1.5 bg-black text-white rounded-lg cursor-pointer
                     flex items-center gap-2 shadow-md hover:bg-gray-800 transition-colors
                   ">
                      <span className="text-xs font-bold max-w-[80px] truncate">{kb.name}</span>
                      <button 
                         onClick={(e) => { e.stopPropagation(); handleRemoveKB(kb.id); }}
                         className="hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                   </div>
                   
                   {/* Hover Preview Tooltip */}
                   <div className="
                     absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white border border-gray-200 
                     rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30
                   ">
                      <div className="text-[10px] text-gray-500 leading-relaxed line-clamp-4 font-serif">
                         {kb.content || "暂无内容..."}
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white border-b border-r border-gray-200 rotate-45"></div>
                   </div>
                </div>
              ))}
              
              {/* Add New KB Button (Always at end) */}
              <button 
                 onClick={() => setEditingKB({ content: '', isSaving: false, title: '' })}
                 className="
                   h-8 w-8 rounded-lg border-2 border-dashed border-gray-300 
                   flex items-center justify-center text-gray-400 
                   hover:border-black hover:text-black hover:bg-white transition-all
                 "
                 title="新建知识库"
              >
                 <Plus className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Create Button */}
        <div className="absolute bottom-8 right-8">
           <button 
             onClick={() => onCreate(formData)}
             disabled={!formData.title.trim()}
             className={`
               px-8 py-3 rounded-xl border-2 border-black font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
               transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
               ${formData.title.trim() 
                 ? 'bg-white text-black hover:bg-gray-50' 
                 : 'bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed'}
             `}
           >
             创建
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNovelCard;
