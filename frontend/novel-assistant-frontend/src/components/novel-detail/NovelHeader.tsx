import React from 'react';
import { Novel } from '@/types/novel';
import { Book, Clock, FileText, Tag } from 'lucide-react';

interface NovelHeaderProps {
  novel: Novel;
}

const NovelHeader: React.FC<NovelHeaderProps> = ({ novel }) => {
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm border border-stone-100 flex flex-col md:flex-row gap-8 animate-fade-in-up mb-8">
      {/* Cover Section */}
      <div className="shrink-0 flex justify-center md:justify-start">
        <div className="w-40 h-56 relative rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
           {novel.cover ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
           ) : (
               <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-600 flex flex-col items-center justify-center p-4 text-white">
                    <div className="w-10 h-10 border-2 border-white/30 rounded-full flex items-center justify-center mb-3">
                        <Book className="w-5 h-5 text-white/80" />
                    </div>
                    <h3 className="text-center font-serif font-bold text-base leading-tight line-clamp-3 opacity-90 px-1">
                        {novel.title}
                    </h3>
                    <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
                    {/* Decorative spine effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/10"></div>
               </div>
           )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col min-w-0">
          {/* Header: Title & Status */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight mb-3">
                    {novel.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                        novel.status === '连载中' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${novel.status === '连载中' ? 'bg-emerald-500' : 'bg-stone-400'}`}></div>
                        {novel.status}
                    </span>
                    {novel.type && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-500 border border-stone-200 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {novel.type}
                        </span>
                    )}
                </div>
              </div>
          </div>
          
          {/* Metadata Grid */}
          <div className="flex items-center gap-6 py-4 border-y border-stone-100 mb-5">
              <div className="flex items-center gap-2 text-stone-600">
                  <FileText className="w-4 h-4 text-stone-400" />
                  <span className="text-sm font-medium">{novel.wordCount.toLocaleString()}</span>
                  <span className="text-xs text-stone-400">字</span>
              </div>
              <div className="w-px h-4 bg-stone-200"></div>
              <div className="flex items-center gap-2 text-stone-600">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className="text-sm font-medium">{novel.updatedAt}</span>
                  <span className="text-xs text-stone-400">更新</span>
              </div>
          </div>

          {/* Synopsis */}
          <div className="relative flex-1">
               <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">简介</h3>
               <p className="font-serif text-stone-600 leading-relaxed text-justify line-clamp-4 md:line-clamp-none text-sm md:text-base">
                   {novel.synopsis || "暂无简介..."}
               </p>
          </div>
      </div>
    </div>
  );
};

export default NovelHeader;