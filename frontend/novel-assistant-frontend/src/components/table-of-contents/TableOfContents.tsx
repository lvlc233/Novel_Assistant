"use client";

import { useState, useEffect } from 'react';
import { Volume, Chapter } from '@/types/novel';

interface TableOfContentsProps {
  isVisible?: boolean;
  volumes: Volume[];
  orphanChapters: Chapter[];
  onSelectChapter: (chapterId: string) => void;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export default function TableOfContents({ 
    isVisible = true, 
    volumes: initialVolumes, 
    orphanChapters, 
    onSelectChapter, 
    onToggle, 
    isCollapsed = false 
}: TableOfContentsProps) {
  const [volumes, setVolumes] = useState<Volume[]>(initialVolumes);

  useEffect(() => {
    setVolumes(initialVolumes);
  }, [initialVolumes]);

  const toggleVolume = (volumeId: string) => {
    setVolumes(volumes.map(vol => 
      vol.id === volumeId 
        ? { ...vol, isExpanded: !vol.isExpanded }
        : vol
    ));
  };

  if (!isVisible) return null;

  if (isCollapsed) {
      return (
          <div className="h-full w-12 flex flex-col items-center bg-gray-50/30 border-r border-gray-100 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={onToggle}>
              <div className="flex-1 flex flex-col items-center gap-4 pt-2">
                  {/* Vertical Text */}
                  <div className="writing-vertical-rl text-xs font-serif text-gray-400 tracking-widest whitespace-nowrap">
                      目录结构
                  </div>
              </div>
              <div className="w-2 h-2 bg-black rounded-sm rotate-45 mb-4"></div>
          </div>
      )
  }

  return (
    <div className="h-full w-64 flex flex-col bg-transparent relative">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
            <h3 className="font-serif font-bold text-gray-800 tracking-wider text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-sm rotate-45"></span>
                目录结构
            </h3>
            {onToggle && (
                <button onClick={onToggle} className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400">
                    <span className="text-xs">◀</span>
                </button>
            )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
            {volumes.map((volume) => (
              <div key={volume.id} className="mb-2">
                <div 
                  className="flex items-center py-2 px-2 cursor-pointer text-gray-700 hover:text-black hover:bg-white rounded-lg transition-all group"
                  onClick={() => toggleVolume(volume.id)}
                >
                  <span className={`text-[10px] mr-2 text-gray-400 group-hover:text-black transition-transform duration-200 ${volume.isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  <span className="text-sm font-serif font-medium flex-1 truncate">{volume.title}</span>
                </div>
                
                <div className={`pl-6 overflow-hidden transition-all duration-300 ${volume.isExpanded ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                   {/* Dotted Line Guide */}
                   <div className="border-l border-dashed border-gray-200 pl-2 space-y-1">
                      {volume.chapters.map((chapter) => (
                        <div 
                          key={chapter.id} 
                          className="py-1.5 px-3 text-sm text-gray-500 hover:text-black hover:bg-gray-100 rounded-md cursor-pointer transition-colors font-sans truncate"
                          onClick={() => onSelectChapter(chapter.id)}
                        >
                          {chapter.title}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ))}

            {orphanChapters && orphanChapters.length > 0 && (
              <div className="mb-2">
                 <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    未分类章节
                 </div>
                 <div className="pl-2 space-y-1">
                    {orphanChapters.map((chapter) => (
                      <div 
                        key={chapter.id} 
                        className="py-1.5 px-3 text-sm text-gray-500 hover:text-black hover:bg-gray-100 rounded-md cursor-pointer transition-colors font-sans truncate"
                        onClick={() => onSelectChapter(chapter.id)}
                      >
                        {chapter.title}
                      </div>
                    ))}
                 </div>
              </div>
            )}
        </div>
        
        {/* Decorative Diamond Footer */}
        <div className="h-12 border-t border-gray-200 flex items-center justify-center">
             <div className="w-3 h-3 bg-gray-200 rotate-45"></div>
        </div>
    </div>
  );
}
