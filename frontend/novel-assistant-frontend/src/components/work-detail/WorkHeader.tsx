import React from 'react';
import { Work } from '@/types/work';
import { Book, Clock, Tag, Edit } from 'lucide-react';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260131-02
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-31 14:35
 * 更新记录:
 * - [2026-01-31 14:35:FE-REF-20260131-02: 使用通用 Work 类型替代 Novel，支持更多作品类型。]
 * - [2026-01-31 14:30:FE-REF-20260131-01: 重构 Header 样式，改为紧凑横向布局，优化空间利用。]
 */

interface WorkHeaderProps {
  work: Work;
  onEdit: () => void;
}

const WorkHeader: React.FC<WorkHeaderProps> = ({ work, onEdit }) => {
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-stone-100 flex gap-6 animate-fade-in-up mb-2 relative group items-start">
      {/* Edit Button - Visible on hover or always if mobile */}
      {onEdit && (
          <button 
            onClick={onEdit}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
            title="编辑作品信息"
          >
              <Edit className="w-4 h-4" />
          </button>
      )}

      {/* Cover Section - More Compact */}
      <div className="shrink-0">
        <div className="w-24 h-32 relative rounded shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300">
           {work.cover ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={work.cover} alt={work.title} className="w-full h-full object-cover" />
           ) : (
               <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-600 flex flex-col items-center justify-center p-2 text-white">
                    <div className="w-8 h-8 border-2 border-white/30 rounded-full flex items-center justify-center mb-2">
                        <Book className="w-4 h-4 text-white/80" />
                    </div>
                    <h3 className="text-center font-serif font-bold text-xs leading-tight line-clamp-2 opacity-90 px-1">
                        {work.title}
                    </h3>
               </div>
           )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col min-w-0 gap-2">
          {/* Header: Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
                    {work.title}
                </h1>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        work.status === '连载中' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}>
                        <div className={`w-1 h-1 rounded-full ${work.status === '连载中' ? 'bg-emerald-500' : 'bg-stone-400'}`}></div>
                        {work.status}
                    </span>
                    {work.type && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-50 text-stone-500 border border-stone-200 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {work.type}
                        </span>
                    )}
                </div>
              </div>
          </div>
          
          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{work.updatedAt} 更新</span>
              </div>
          </div>

          {/* Synopsis */}
          <div className="relative flex-1 mt-1">
               <p className="font-serif text-stone-600 leading-relaxed text-justify line-clamp-2 text-sm hover:line-clamp-none transition-all cursor-default" title={work.synopsis}>
                   {work.synopsis || "暂无简介..."}
               </p>
          </div>
      </div>
    </div>
  );
};

export default WorkHeader;