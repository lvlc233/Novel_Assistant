import React, { useState } from 'react';
import { Chapter } from '@/types/novel';
import { ChevronDown } from 'lucide-react';

interface ChapterPreviewProps {
  chapter?: Chapter;
  onEdit: () => void;
}

const ChapterPreview: React.FC<ChapterPreviewProps> = ({ chapter, onEdit }) => {
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);

  // If no chapter selected, maybe show nothing or a placeholder?
  // User sketch shows a dashed border box.
  
  if (!chapter) {
      return (
        <div className="flex-1 h-full border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 font-serif">
            请选择章节查看预览
        </div>
      );
  }

  const currentVersion = chapter.versions.find(v => v.id === chapter.currentVersionId) || chapter.versions[0];

  return (
    <div className="flex-1 h-full border-2 border-dashed border-black/30 rounded-xl relative flex flex-col p-8 bg-white/50 animate-fade-in">
        {/* Version Selector (Top Right) */}
        <div className="absolute top-0 right-0 p-4">
             <div className="relative">
                <button 
                  onClick={() => setIsVersionMenuOpen(!isVersionMenuOpen)}
                  className="flex items-center gap-2 text-xs font-bold hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <span>{currentVersion ? `v${currentVersion.versionNumber}.0` : 'v1.0'}</span>
                    <div className="w-8 h-[2px] bg-black"></div> {/* Visual separator/line from sketch */}
                </button>
                
                {isVersionMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border-2 border-black rounded-lg shadow-xl z-20 py-2">
                        {chapter.versions.map(v => (
                            <button 
                                key={v.id}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs flex justify-between items-center"
                                onClick={() => setIsVersionMenuOpen(false)}
                            >
                                <span className="font-bold">v{v.versionNumber}.0</span>
                                <span className="text-gray-400 font-serif truncate max-w-[80px]">{v.note}</span>
                            </button>
                        ))}
                    </div>
                )}
             </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto mt-8 font-serif text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
            {currentVersion?.content || "暂无内容..."}
        </div>

        {/* Create/Edit Button (Bottom Right) */}
        <div className="absolute bottom-6 right-6">
            <button 
                onClick={onEdit}
                className="
                    px-6 py-2 bg-white border-2 border-black rounded-lg 
                    text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    hover:translate-x-[1px] hover:translate-y-[1px] 
                    hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] 
                    active:translate-x-[2px] active:translate-y-[2px] 
                    active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    transition-all
                "
            >
                创作
            </button>
        </div>
    </div>
  );
};

export default ChapterPreview;