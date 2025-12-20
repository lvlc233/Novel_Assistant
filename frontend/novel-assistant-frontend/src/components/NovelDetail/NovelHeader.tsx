import React from 'react';
import { Novel } from '@/types/novel';

interface NovelHeaderProps {
  novel: Novel;
}

const NovelHeader: React.FC<NovelHeaderProps> = ({ novel }) => {
  return (
    <div className="flex gap-8 w-full h-[280px]">
      {/* Cover */}
      <div className="w-52 h-full border-2 border-black rounded-lg flex items-center justify-center relative overflow-hidden bg-white shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
         {novel.cover ? (
             <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
         ) : (
             <div className="flex flex-col items-center justify-center w-full h-full bg-white relative">
                  {/* Mock abstract art like in the sketch */}
                  <div className="absolute top-8 left-8 w-8 h-8 bg-black rounded-full"></div>
                  <div className="absolute bottom-0 w-full h-1/2 bg-black transform skew-y-[-10deg] origin-bottom-left"></div>
             </div>
         )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col pt-2">
          <h1 className="text-5xl font-serif font-bold mb-4 tracking-wide">{novel.title}</h1>
          
          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-serif mb-6 uppercase tracking-wider">
              <span className="font-bold text-black text-sm">小说简介</span>
              <span className="text-gray-300">|</span>
              <span>{novel.status}</span>
              <span className="text-gray-300">|</span>
              <span>{novel.wordCount} 字</span>
              <span className="text-gray-300">|</span>
              <span>{novel.createdAt}</span>
              <span className="text-gray-300">|</span>
              <span>{novel.updatedAt}</span>
          </div>

          {/* Synopsis (Dashed Lines) */}
          <div className="flex-1 relative">
               <div className="absolute inset-0 flex flex-col gap-[28px]">
                   {Array.from({ length: 5 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-full border-b border-dashed border-gray-400 h-[28px]"
                      ></div>
                   ))}
               </div>
               
               <div className="absolute inset-0 pt-0.5 px-1">
                   <p className="font-serif leading-[29px] text-gray-800 line-clamp-5">
                       {novel.synopsis}
                   </p>
               </div>
          </div>
      </div>
    </div>
  );
};

export default NovelHeader;