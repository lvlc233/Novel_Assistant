import React, { useState, useRef, useEffect } from 'react';
import { Volume, Chapter } from '@/types/novel';
import { ChevronRight, ChevronDown, Folder, FileText, MoreVertical } from 'lucide-react';

interface NovelDirectoryProps {
  volumes: Volume[];
  orphanChapters: Chapter[];
  selectedChapterId?: string;
  onSelectChapter: (chapter: Chapter) => void;
  onUpdateVolume: (volumeId: string, data: Partial<Volume>) => void;
  onUpdateChapter: (chapterId: string, data: Partial<Chapter>) => void;
  onCreateVolume: () => void;
  onCreateChapter: (volumeId?: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'root' | 'volume' | 'chapter';
  targetId?: string;
}

const NovelDirectory: React.FC<NovelDirectoryProps> = ({
  volumes,
  orphanChapters,
  selectedChapterId,
  onSelectChapter,
  onUpdateVolume,
  onUpdateChapter,
  onCreateVolume,
  onCreateChapter
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
            group flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-colors ml-6
            ${selectedChapterId === chapter.id ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}
        `}
        onClick={(e) => {
            e.stopPropagation();
            onSelectChapter(chapter);
        }}
        onContextMenu={(e) => handleContextMenu(e, 'chapter', chapter.id)}
    >
        {/* <FileText className="w-4 h-4 shrink-0" /> */}
        {editingId === chapter.id ? (
            <input 
                autoFocus
                className="bg-transparent border-b border-current outline-none w-full text-sm font-serif"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                onClick={(e) => e.stopPropagation()}
            />
        ) : (
            <div className="flex items-baseline gap-2 overflow-hidden">
                <span className="text-sm font-serif truncate">{chapter.title}</span>
                <span className={`text-[10px] ${selectedChapterId === chapter.id ? 'text-gray-300' : 'text-gray-400'}`}>
                    (v{chapter.versions.find(v => v.id === chapter.currentVersionId)?.versionNumber || 1}.0)
                </span>
            </div>
        )}
    </div>
  );

  return (
    <div 
        ref={containerRef}
        className="w-64 h-full border-2 border-dashed border-gray-300 rounded-xl p-4 overflow-y-auto relative"
        onContextMenu={(e) => handleContextMenu(e, 'root')}
    >
      <h3 className="font-bold text-lg font-serif mb-4 flex items-center gap-2">
          <ChevronDown className="w-5 h-5" />
          目录
      </h3>

      <div className="space-y-1">
        {/* Volumes */}
        {volumes.map(volume => (
            <div key={volume.id}>
                <div 
                    className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded-lg cursor-pointer text-black font-bold"
                    onClick={() => onUpdateVolume(volume.id, { isExpanded: !volume.isExpanded })}
                    onContextMenu={(e) => handleContextMenu(e, 'volume', volume.id)}
                >
                    {volume.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {editingId === volume.id ? (
                        <input 
                            autoFocus
                            className="bg-transparent border-b border-black outline-none w-full text-sm font-serif"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm font-serif truncate">{volume.title}</span>
                    )}
                </div>
                
                {/* Volume Chapters */}
                {volume.isExpanded && (
                    <div className="mt-1 mb-2">
                        {volume.chapters.map(renderChapterItem)}
                    </div>
                )}
            </div>
        ))}

        {/* Orphan Chapters (Always below volumes) */}
        {orphanChapters.map(renderChapterItem)}
        
        {/* Empty State */}
        {volumes.length === 0 && orphanChapters.length === 0 && (
            <div className="text-center text-gray-400 text-xs py-8 font-serif">
                右键点击创建章节
            </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
            className="fixed bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 py-1 w-32 animate-fade-in"
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            {contextMenu.type === 'root' && (
                <>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold"
                        onClick={() => { onCreateVolume(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                    >
                        创建卷
                    </button>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold"
                        onClick={() => { onCreateChapter(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                    >
                        创建章节
                    </button>
                </>
            )}
            {contextMenu.type === 'volume' && (
                <>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold"
                        onClick={() => { onCreateChapter(contextMenu.targetId); setContextMenu(prev => ({ ...prev, visible: false })); }}
                    >
                        创建章节
                    </button>
                    <button 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold"
                        onClick={() => { 
                            const vol = volumes.find(v => v.id === contextMenu.targetId);
                            if (vol) startEditing(vol.id, vol.title);
                        }}
                    >
                        重命名
                    </button>
                </>
            )}
            {contextMenu.type === 'chapter' && (
                <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs font-bold"
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
                    重命名
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default NovelDirectory;