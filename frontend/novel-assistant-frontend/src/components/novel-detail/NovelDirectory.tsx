import React, { useState, useRef, useEffect } from 'react';
import { Volume, Chapter } from '@/types/novel';
import { ChevronRight, ChevronDown, Folder, FileText, Plus, Edit2, Trash2 } from 'lucide-react';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-02
 * 创建时间: 2026-01-20 21:48
 * 更新时间: 2026-01-20 21:48
 * 更新记录:
 * - [2026-01-20 21:48:FE-REF-20260120-02: 在何处使用: 小说详情目录组件；如何使用: 右键打开菜单/重命名/新建；实现概述: 清理未使用图标 import，消除 lint。]
 */

interface NovelDirectoryProps {
  volumes: Volume[];
  orphanChapters: Chapter[];
  selectedChapterId?: string;
  onSelectChapter: (chapter: Chapter) => void;
  onUpdateVolume: (volumeId: string, data: Partial<Volume>) => void;
  onUpdateChapter: (chapterId: string, data: Partial<Chapter>) => void;
  onCreateVolume: () => void;
  onCreateChapter: (volumeId?: string) => void;
  onDeleteVolume: (volumeId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'root' | 'volume' | 'chapter';
  targetId?: string;
}
// 目录
const NovelDirectory: React.FC<NovelDirectoryProps> = ({
  volumes,
  orphanChapters,
  selectedChapterId,
  onSelectChapter,
  onUpdateVolume,
  onUpdateChapter,
  onCreateVolume,
  onCreateChapter,
  onDeleteVolume,
  onDeleteChapter
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, type: 'root' });
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, type: 'root' | 'volume' | 'chapter', id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      targetId: id
    });
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    
    // Check if it's a volume or chapter
    const isVolume = volumes.some(v => v.id === editingId);
    if (isVolume) {
        onUpdateVolume(editingId, { title: editValue });
    } else {
        onUpdateChapter(editingId, { title: editValue });
    }
    setEditingId(null);
  };

  const renderChapterItem = (chapter: Chapter) => (
    <div 
        key={chapter.id}
        className={`
            group flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-all duration-200 ml-4
            ${selectedChapterId === chapter.id 
                ? 'bg-stone-800 text-white shadow-md' 
                : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'}
        `}
        onClick={(e) => {
            e.stopPropagation();
            onSelectChapter(chapter);
        }}
        onContextMenu={(e) => handleContextMenu(e, 'chapter', chapter.id)}
    >
        <FileText className={`w-4 h-4 shrink-0 ${selectedChapterId === chapter.id ? 'text-stone-400' : 'text-stone-400 group-hover:text-stone-600'}`} />
        {editingId === chapter.id ? (
            <input 
                autoFocus
                className="bg-transparent border-b border-white/50 outline-none w-full text-sm font-medium"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                onClick={(e) => e.stopPropagation()}
            />
        ) : (
            <div className="flex items-center justify-between w-full overflow-hidden">
                <span className="text-sm font-medium truncate">{chapter.title}</span>
                <span className={`text-[10px] shrink-0 ml-2 px-1.5 py-0.5 rounded-full ${selectedChapterId === chapter.id ? 'bg-white/10 text-stone-300' : 'bg-stone-200 text-stone-500'}`}>
                    v{chapter.versions.find(v => v.id === chapter.currentVersionId)?.versionNumber || 1}.0
                </span>
            </div>
        )}
    </div>
  );

  return (
    <div 
        ref={containerRef}
        className="w-full h-full bg-white flex flex-col overflow-hidden"
        onContextMenu={(e) => handleContextMenu(e, 'root')}
    >
      <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <Folder className="w-4 h-4 text-stone-500" />
              目录结构
          </h3>
          <button 
            onClick={() => onCreateChapter()} 
            className="p-1.5 hover:bg-stone-200 rounded-md text-stone-500 transition-colors"
            title="新建章节"
          >
              <Plus className="w-4 h-4" />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {/* Volumes */}
        {volumes.map(volume => (
            <div key={volume.id} className="mb-1">
                <div 
                    className="flex items-center gap-2 py-2 px-2 hover:bg-stone-100 rounded-lg cursor-pointer text-stone-800 font-bold transition-colors"
                    onClick={() => onUpdateVolume(volume.id, { isExpanded: !volume.isExpanded })}
                    onContextMenu={(e) => handleContextMenu(e, 'volume', volume.id)}
                >
                    <div className="p-0.5 rounded hover:bg-stone-200 transition-colors">
                        {volume.isExpanded ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                    </div>
                    {editingId === volume.id ? (
                        <input 
                            autoFocus
                            className="bg-transparent border-b border-stone-300 outline-none w-full text-sm font-bold"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm truncate select-none">{volume.title}</span>
                    )}
                </div>
                
                {/* Volume Chapters */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${volume.isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="border-l border-stone-200 ml-4 pl-1 my-1 space-y-0.5">
                        {volume.chapters.map(renderChapterItem)}
                    </div>
                </div>
            </div>
        ))}

        {/* Orphan Chapters (Always below volumes) */}
        {orphanChapters.length > 0 && (
             <div className="mt-2 pt-2 border-t border-stone-100">
                <div className="text-xs font-bold text-stone-400 px-3 py-1 mb-1 uppercase tracking-wider">未分类章节</div>
                {orphanChapters.map(renderChapterItem)}
             </div>
        )}
        
        {/* Empty State */}
        {volumes.length === 0 && orphanChapters.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400 gap-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-stone-300" />
                </div>
                <span className="text-sm font-medium">暂无章节</span>
                <button 
                    onClick={() => onCreateChapter()}
                    className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-md hover:bg-stone-700 transition-colors"
                >
                    立即创建
                </button>
            </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
            className="fixed bg-white border border-stone-200 rounded-lg shadow-xl z-50 py-1 w-40 animate-scale-up"
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            {contextMenu.type === 'root' && (
                <>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                        onClick={(e) => { 
                            e.stopPropagation();
                            onCreateVolume(); 
                            setContextMenu(prev => ({ ...prev, visible: false })); 
                        }}
                    >
                        <Folder className="w-4 h-4" /> 创建卷
                    </button>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                        onClick={(e) => { 
                            e.stopPropagation();
                            onCreateChapter(); 
                            setContextMenu(prev => ({ ...prev, visible: false })); 
                        }}
                    >
                        <FileText className="w-4 h-4" /> 创建章节
                    </button>
                </>
            )}
            {contextMenu.type === 'volume' && (
                <>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                        onClick={() => { onCreateChapter(contextMenu.targetId); setContextMenu(prev => ({ ...prev, visible: false })); }}
                    >
                        <Plus className="w-4 h-4" /> 添加章节
                    </button>
                    <div className="h-px bg-stone-100 my-1"></div>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                        onClick={() => { 
                            const vol = volumes.find(v => v.id === contextMenu.targetId);
                            if (vol) startEditing(vol.id, vol.title);
                        }}
                    >
                        <Edit2 className="w-4 h-4" /> 重命名
                    </button>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-red-600 flex items-center gap-2"
                        onClick={() => { 
                            if (contextMenu.targetId) onDeleteVolume(contextMenu.targetId);
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <Trash2 className="w-4 h-4" /> 删除卷
                    </button>
                </>
            )}
            {contextMenu.type === 'chapter' && (
                <>
                <button 
                    className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                    onClick={() => { 
                        // Find chapter in volumes or orphans
                        let chap = orphanChapters.find(c => c.id === contextMenu.targetId);
                        if (!chap) {
                            volumes.forEach(v => {
                                const found = v.chapters.find(c => c.id === contextMenu.targetId);
                                if (found) chap = found;
                            });
                        }
                        if (chap) startEditing(chap.id, chap.title);
                    }}
                >
                    <Edit2 className="w-4 h-4" /> 重命名
                </button>
                <button 
                    className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-red-600 flex items-center gap-2"
                    onClick={() => { 
                        if (contextMenu.targetId) onDeleteChapter(contextMenu.targetId);
                        setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                >
                    <Trash2 className="w-4 h-4" /> 删除章节
                </button>
                </>
            )}
        </div>
      )}
    </div>
  );
};

export default NovelDirectory;
