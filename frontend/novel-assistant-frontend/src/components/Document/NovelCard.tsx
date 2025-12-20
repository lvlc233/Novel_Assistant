import React, { useState } from 'react';
import { Novel } from '@/types/novel';

interface NovelCardProps {
  novel: Novel;
  isActive?: boolean;
  onEdit?: (novel: Novel) => void;
  onDelete?: (id: string) => void;
  onOpenKnowledgeBase?: (novel: Novel) => void;
}

const NovelCard: React.FC<NovelCardProps> = ({ 
  novel, 
  isActive = false,
  onEdit, 
  onDelete, 
  onOpenKnowledgeBase 
}) => {
  const [mode, setMode] = useState<'view' | 'delete' | 'edit'>('view');
  const [editTitle, setEditTitle] = useState(novel.title);
  const [editStatus, setEditStatus] = useState<Novel['status']>(novel.status);

  // Reset state when active status changes or novel changes
  React.useEffect(() => {
    if (!isActive) {
      setMode('view');
    }
  }, [isActive]);

  const handleDeleteConfirm = () => {
    onDelete?.(novel.id);
    setMode('view');
  };

  const handleEditConfirm = () => {
    if (onEdit) {
      onEdit({
        ...novel,
        title: editTitle,
        status: editStatus
      });
    }
    setMode('view');
  };

  // Coordinates for dashed lines
  // Card Size: w-72 (288px) x h-96 (384px)
  // Popup: w-[240px], centered -> left: 24px. Top: say 96px (approx 1/4 down).
  // Button Container: top-3 right-3 (12px, 12px).
  // Red Dot (Delete): Approx x=228, y=18
  // Yellow Dot (Edit): Approx x=246, y=18
  
  const popupTopY = 110;
  const popupLeftX = 24;
  const popupRightX = 264; // 24 + 240
  
  const redDotX = 228;
  const redDotY = 18;
  
  const yellowDotX = 246;
  const yellowDotY = 18;

  return (
    <div className={`
      relative w-72 h-96 bg-surface-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden
      flex flex-col group
      transition-all duration-500 ease-out
      ${isActive ? 'scale-100 opacity-100 shadow-2xl' : 'scale-90 opacity-60 blur-[1px]'}
    `}>
      {/* Dashed Lines Layer (Only visible in edit/delete mode) */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-30" style={{ opacity: mode !== 'view' ? 1 : 0 }}>
         {mode === 'delete' && (
           <>
             <line x1={redDotX} y1={redDotY} x2={popupLeftX} y2={popupTopY} stroke="#FF5F57" strokeWidth="1.5" strokeDasharray="6 4" />
             <line x1={redDotX} y1={redDotY} x2={popupRightX} y2={popupTopY} stroke="#FF5F57" strokeWidth="1.5" strokeDasharray="6 4" />
           </>
         )}
         {mode === 'edit' && (
           <>
             <line x1={yellowDotX} y1={yellowDotY} x2={popupLeftX} y2={popupTopY} stroke="#FFBD2E" strokeWidth="1.5" strokeDasharray="6 4" />
             <line x1={yellowDotX} y1={yellowDotY} x2={popupRightX} y2={popupTopY} stroke="#FFBD2E" strokeWidth="1.5" strokeDasharray="6 4" />
           </>
         )}
      </svg>

      {/* Mac-style Window Controls */}
      <div className={`
          absolute top-3 right-3 z-40 flex gap-1.5 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-black/5 
          transition-opacity duration-300
          ${mode !== 'view' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      `}>
        {/* Red: Delete */}
        <button 
          onClick={(e) => { e.stopPropagation(); setMode('delete'); }}
          className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/10 shadow-inner transform transition-all duration-200 hover:scale-125 hover:brightness-90"
          title="删除"
        />
        {/* Yellow: Edit */}
        <button 
          onClick={(e) => { e.stopPropagation(); setMode('edit'); setEditTitle(novel.title); setEditStatus(novel.status); }}
          className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 shadow-inner transform transition-all duration-200 hover:scale-125 hover:brightness-90"
          title="编辑"
        />
        {/* Green: Knowledge Base */}
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenKnowledgeBase?.(novel); }}
          className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 shadow-inner transform transition-all duration-200 hover:scale-125 hover:brightness-90"
          title="知识库"
        />
      </div>

      {/* Popups */}
      {mode === 'delete' && (
        <div 
          className="absolute z-30 w-60 left-6 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex flex-col items-center animate-fade-in-up"
          style={{ top: '110px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-sm font-medium text-gray-800 mb-4 text-center">
            是否确认删除<br/>
            <span className="font-bold text-black">“{novel.title}”</span>
          </h4>
          <div className="flex gap-3 w-full">
            <button 
              onClick={handleDeleteConfirm}
              className="flex-1 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              确认
            </button>
            <button 
              onClick={() => setMode('view')}
              className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div 
          className="absolute z-30 w-60 left-6 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex flex-col animate-fade-in-up"
          style={{ top: '110px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3">
             <label className="text-xs text-gray-500 mb-1 block">小说名</label>
             <input 
               type="text" 
               value={editTitle}
               onChange={(e) => setEditTitle(e.target.value)}
               className="w-full text-sm border-b border-gray-200 focus:border-black outline-none py-1 bg-transparent font-serif font-bold"
             />
          </div>
          <div className="mb-4">
             <label className="text-xs text-gray-500 mb-2 block">小说状态</label>
             <div className="flex gap-2">
                {(['连载中', '完结', '断更'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditStatus(s)}
                    className={`
                      px-2 py-1 rounded text-[10px] border transition-all
                      ${editStatus === s 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}
                    `}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>
          <div className="flex gap-3 w-full">
            <button 
              onClick={handleEditConfirm}
              className="flex-1 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              确认
            </button>
            <button 
              onClick={() => setMode('view')}
              className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Cover Image Area - Dimmed when modal open */}
      <div className={`h-48 w-full bg-surface-secondary relative overflow-hidden transition-all duration-300 border-b border-black/10 ${mode !== 'view' ? 'blur-sm opacity-50' : 'group-hover:bg-surface-hover'}`}>
        {novel.cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-secondary">
            <div className="w-16 h-16 rounded-full bg-surface-white shadow-inner flex items-center justify-center">
              <span className="text-2xl text-gray-300">📚</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area - Dimmed when modal open */}
      <div className={`flex-1 p-5 flex flex-col justify-between bg-surface-white transition-all duration-300 ${mode !== 'view' ? 'blur-sm opacity-50' : ''}`}>
        <div>
          <h3 className="text-xl font-serif font-bold text-text-primary mb-3 line-clamp-1" title={novel.title}>
            {novel.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary font-sans">
              更新字数: <span className="font-medium text-text-primary">{novel.wordCount.toLocaleString()}</span>
            </p>
            <span className="px-2 py-0.5 rounded border border-gray-300 text-xs text-gray-600 bg-gray-50">
              {novel.status}
            </span>
          </div>
        </div>

        <div className="border-t border-border-primary pt-3 mt-2">
          <p className="text-xs text-text-secondary">
            最新更新: {new Date(novel.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NovelCard;
