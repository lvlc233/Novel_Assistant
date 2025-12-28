import React from 'react';
import { Novel } from '@/types/novel';
import { Book, Clock, FileText, Tag } from 'lucide-react';

interface NovelHeaderProps {
  novel: Novel;
}

const NovelHeader: React.FC<NovelHeaderProps> = ({ novel }) => {
  return (
    <div className="w-full flex flex-col md:flex-row gap-8 animate-fade-in-up">
      {/* Cover Section */}
      <div className="shrink-0">
        <div className="w-48 h-64 relative rounded-lg shadow-xl overflow-hidden group transition-transform hover:-translate-y-1 duration-300">
           {novel.cover ? (
               <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
           ) : (
               <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-600 flex flex-col items-center justify-center p-6 text-white">
                    <div className="w-12 h-12 border-2 border-white/30 rounded-full flex items-center justify-center mb-4">
                        <Book className="w-6 h-6 text-white/80" />
                    </div>
                    <h3 className="text-center font-serif font-bold text-lg leading-tight line-clamp-3 opacity-90">
                        {novel.title}
                    </h3>
                    <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
                    {/* Decorative spine effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10"></div>
               </div>
           )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col py-1">
          <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2 tracking-tight">
                    {novel.title}
                </h1>
                <div className="flex flex-wrap gap-3 mb-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 
                        ${novel.status === '连载中' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-stone-100 text-stone-600 border border-stone-200'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${novel.status === '连载中' ? 'bg-emerald-500' : 'bg-stone-400'}`}></div>
                        {novel.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        {novel.wordCount} 字
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-50 text-stone-600 border border-stone-200 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {novel.updatedAt} 更新
                    </span>
                </div>
              </div>
          </div>

          {/* Synopsis Card */}
          <div className="flex-1 bg-white rounded-xl border border-stone-200 p-5 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-stone-200 group-hover:bg-stone-400 transition-colors"></div>
               <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <Tag className="w-3 h-3" />
                   简介
               </h3>
               <p className="font-serif text-stone-700 leading-relaxed text-justify line-clamp-4 hover:line-clamp-none transition-all duration-300">
                   {novel.synopsis || "暂无简介..."}
               </p>
          </div>
      </div>
    </div>
  );
};

export default NovelHeader;