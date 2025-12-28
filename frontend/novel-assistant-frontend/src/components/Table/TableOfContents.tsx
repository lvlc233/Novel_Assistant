"use client";

import { useState, useEffect } from 'react';
import { Volume, Chapter } from '@/types/novel';

interface TableOfContentsProps {
  isVisible?: boolean;
  volumes: Volume[];
  orphanChapters: Chapter[];
  onSelectChapter: (chapterId: string) => void;
}

export default function TableOfContents({ isVisible = true, volumes: initialVolumes, orphanChapters, onSelectChapter }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [volumes, setVolumes] = useState<Volume[]>(initialVolumes);

  useEffect(() => {
    setVolumes(initialVolumes);
  }, [initialVolumes]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toggleVolume = (volumeId: string) => {
    setVolumes(volumes.map(vol => 
      vol.id === volumeId 
        ? { ...vol, isExpanded: !vol.isExpanded }
        : vol
    ));
  };

  if (!isVisible) return null;

  return (
    <div className={`toc-container ${isOpen ? '' : 'closed'}`}>
      {/* 菱形书签切换按钮 - 移到外部避免被clip-path裁剪 */}
      <div className={`toc-bookmark ${isOpen ? 'open' : 'closed'}`} onClick={toggleOpen}>
        <div className="bookmark-diamond"></div>
      </div>
      
      <div className="table-of-contents">
        {/* 目录内容 */}
        <div className="toc-content">
          <div className="toc-header">
            <h3>目录</h3>
          </div>
          
          <div className="toc-list">
            {volumes.map((volume) => (
              <div key={volume.id} className="volume-item">
                <div 
                  className="volume-header"
                  onClick={() => toggleVolume(volume.id)}
                >
                  <span className="volume-title">{volume.title}</span>
                  <span className={`volume-arrow ${volume.isExpanded ? 'expanded' : 'collapsed'}`}>
                    ▶
                  </span>
                </div>
                
                <div className={`chapter-list ${!volume.isExpanded ? 'collapsed' : ''}`}>
                  {volume.chapters.map((chapter) => (
                    <div 
                      key={chapter.id} 
                      className="chapter-item"
                      onClick={() => onSelectChapter(chapter.id)}
                    >
                      {chapter.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {orphanChapters && orphanChapters.length > 0 && (
              <div className="volume-item">
                <div className="chapter-list">
                  {orphanChapters.map((chapter) => (
                    <div 
                      key={chapter.id} 
                      className="chapter-item"
                      onClick={() => onSelectChapter(chapter.id)}
                    >
                      {chapter.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}