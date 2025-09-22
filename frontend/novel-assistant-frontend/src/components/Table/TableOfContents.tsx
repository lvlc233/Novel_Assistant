"use client";

import { useState } from 'react';

interface Chapter {
  id: string;
  title: string;
}

interface Volume {
  id: string;
  title: string;
  chapters: Chapter[];
  isExpanded: boolean;
}

interface TableOfContentsProps {
  isVisible?: boolean;
}

export default function TableOfContents({ isVisible = true }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [volumes, setVolumes] = useState<Volume[]>([
    {
      id: 'vol1',
      title: '第一卷：序章',
      isExpanded: true,
      chapters: [
        { id: 'ch1', title: '第一章：开始' },
        { id: 'ch2', title: '第二章：相遇' },
        { id: 'ch3', title: '第三章：冒险' }
      ]
    },
    {
      id: 'vol2',
      title: '第二卷：成长',
      isExpanded: false,
      chapters: [
        { id: 'ch4', title: '第四章：挑战' },
        { id: 'ch5', title: '第五章：突破' }
      ]
    }
  ]);

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
                      onClick={() => console.log('跳转到章节:', chapter.title)}
                    >
                      {chapter.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}