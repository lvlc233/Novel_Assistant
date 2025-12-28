import React, { useState } from 'react';
import { Chapter } from '@/types/novel';
import { PenTool, History, ChevronDown } from 'lucide-react';

interface ChapterPreviewProps {
  chapter?: Chapter;
  onEdit: () => void;
}
// TODO: 可能需要更加准确的组件化。
const ChapterPreview: React.FC<ChapterPreviewProps> = ({ chapter, onEdit }) => {
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);

  if (!chapter) {
      return (
        <div className="flex-1 h-full bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-stone-400 gap-4">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center">
                <PenTool className="w-8 h-8 text-stone-300" />
            </div>
            <p className="font-medium">请从左侧选择章节查看预览</p>
        </div>
      );
  }

  const currentVersion = chapter.versions.find(v => v.id === chapter.currentVersionId) || chapter.versions[0];

  return (
    <div className="flex-1 h-full bg-white rounded-xl border border-stone-200 shadow-sm relative flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="h-14 border-b border-stone-100 flex items-center justify-between px-6 bg-white shrink-0 z-10">
             <h2 className="font-serif font-bold text-lg text-stone-800 truncate max-w-[50%]">
                 {chapter.title}
             </h2>

             {/* Version Selector */}
             <div className="relative">
                <button 
                  onClick={() => setIsVersionMenuOpen(!isVersionMenuOpen)}
                  className="flex items-center gap-2 text-xs font-medium bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-full text-stone-600 transition-colors border border-stone-200"
                >
                    <History className="w-3 h-3" />
                    <span>{currentVersion ? `v${currentVersion.versionNumber}.0` : 'v1.0'}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
                
                {isVersionMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-stone-200 rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-scale-up">
                        <div className="px-3 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 border-b border-stone-100">
                            历史版本
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {chapter.versions.map(v => (
                                <button 
                                    key={v.id}
                                    className={`w-full text-left px-4 py-2.5 text-xs flex justify-between items-center transition-colors
                                        ${currentVersion?.id === v.id ? 'bg-stone-50 text-stone-900' : 'hover:bg-stone-50 text-stone-600'}
                                    `}
                                    onClick={() => setIsVersionMenuOpen(false)}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold">v{v.versionNumber}.0</span>
                                        <span className="text-[10px] text-stone-400">{new Date(v.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-stone-400 font-serif truncate max-w-[80px] italic">{v.note}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
             </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
            <div className="max-w-3xl mx-auto font-serif text-lg leading-loose text-stone-800 whitespace-pre-wrap">
                {currentVersion?.content || <span className="text-stone-300 italic">暂无内容，点击右下角按钮开始创作...</span>}
            </div>
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-8 right-8">
            <button 
                onClick={onEdit}
                className="
                    flex items-center gap-2
                    px-6 py-3 bg-stone-900 text-white rounded-full 
                    font-medium shadow-lg shadow-stone-900/20
                    hover:bg-black hover:scale-105 hover:shadow-xl
                    active:scale-95
                    transition-all duration-300
                "
            >
                <PenTool className="w-4 h-4" />
                <span>开始创作</span>
            </button>
        </div>
    </div>
  );
};

export default ChapterPreview;