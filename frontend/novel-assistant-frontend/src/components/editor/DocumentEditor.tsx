"use client";

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import TableOfContents from '../table-of-contents/TableOfContents';
import TiptapEditor from './TiptapEditor';
import { getNovelDetail} from '@/services/novelService';
import {getDocumentDetail, updateDocumentContent, renameDocument } from '@/services/documentService';
import { Volume, Chapter } from '@/types/novel';
import { userId } from '@/services/mock';
import { logger } from '@/lib/logger';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-03
 * 创建时间: 2026-01-20 22:05
 * 更新时间: 2026-01-20 22:05
 * 更新记录:
 * - [2026-01-20 22:05:FE-REF-20260120-03: 在何处使用: 编辑器页面；如何使用: 传入 novelId/currentChapterId；实现概述: 移除 document-editor.css 引用，使用 Tailwind CSS 重构样式，移除 table-of-contents.css 引用。]
 */

const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>?/gm, '');
};


interface DocumentEditorProps {
  isChatExpanded: boolean;
  novelId?: string | null;
  initialChapterId?: string | null;
}
// TODO:后续可能需要重做
export default function DocumentEditor({ isChatExpanded, novelId, initialChapterId }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('未命名文档');
  const [isSaved, setIsSaved] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(initialChapterId || null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [orphanChapters, setOrphanChapters] = useState<Chapter[]>([]);
  const [version, setVersion] = useState<string>('v1.0.0');

  

  useEffect(() => {
    if (novelId) {
      getNovelDetail(userId, novelId).then(novel => {
        setVolumes(novel.volumes || []);
        setOrphanChapters(novel.orphanChapters || []);
      }).catch(err => logger.error("Fetch novel failed", err));
    }
  }, [novelId]);

  useEffect(() => {
    if (currentChapterId) {
       getDocumentDetail({
         document_id: currentChapterId,
         user_id: userId
       }).then(detail => {
           // We only want the body text, strip out any H1 title if it was mistakenly saved in the content
           // But since TiptapEditor manages content, and we removed H1 from it, we just pass body_text.
           // However, if the legacy content has H1, Tiptap might render it.
           // For now, assume content is just HTML body.
           setContent(detail.document_body_text || '');
           setTitle(detail.document_title || '未命名文档');
           if (detail.document_version_id) setVersion(detail.document_version_id);
           setIsSaved(true);
       }).catch(err => logger.error("Fetch document failed", err));
    }
  }, [currentChapterId]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };
  
  const handleTitleSave = async () => {
      if (!novelId || !currentChapterId) return;
      try {
          await renameDocument({
              user_id: userId,
              novel_id: novelId,
              document_id: currentChapterId,
              title: title
          });
          
          // Update local TOC state to reflect new title
          const updateChapterTitle = (chapters: Chapter[]) => 
              chapters.map(c => c.id === currentChapterId ? { ...c, title } : c);
          
          setVolumes(prev => prev.map(v => ({
              ...v,
              chapters: updateChapterTitle(v.chapters)
          })));
          setOrphanChapters(prev => updateChapterTitle(prev));
          
          setIsSaved(true);
          logger.debug('标题保存成功');
      } catch (e) {
          logger.error("Title save failed", e);
      }
  };

  const handleSave = async () => {
    if (!novelId || !currentChapterId) {
        logger.error("Missing novelId or chapterId");
        return;
    }
    try {
        const newVersionId = await updateDocumentContent({
            user_id: userId,
            novel_id: novelId,
            document_id: currentChapterId,
            content: content
        });
        setVersion(newVersionId);
        setIsSaved(true);
        logger.debug('保存文档成功:', { title, content, version: newVersionId });
        
        // Also ensure title is saved if it was changed
        await handleTitleSave();
        
    } catch (e) {
        logger.error("Save failed", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };



  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  // New Layout Implementation
  return (
    <div className="flex h-full w-full bg-white relative">
      {/* 侧边栏目录 - 集成在编辑器左侧 */}
      <div className={`h-full border-r border-gray-100 bg-gray-50/30 flex flex-col relative z-10 transition-all duration-300 ease-in-out overflow-hidden ${isTocCollapsed ? 'w-12' : 'w-64'}`}>
        <div className={`${isTocCollapsed ? 'w-12' : 'w-64'} h-full transition-all duration-300`}>
            <TableOfContents 
                isVisible={true}
                volumes={volumes} 
                orphanChapters={orphanChapters} 
                onSelectChapter={setCurrentChapterId} 
                onToggle={() => setIsTocCollapsed(!isTocCollapsed)}
                isCollapsed={isTocCollapsed}
            />
        </div>
      </div>

      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col h-full relative bg-gray-50/50" onKeyDown={handleKeyDown}>
        
        {/* 顶部工具栏 */}
        <div className="h-14 flex items-center justify-between px-8 border-b border-gray-100 bg-white relative shrink-0">
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              {/* Removed hardcoded VERSION text, using real version data or hiding if not needed */}
              <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{version}</span>
           </div>
           
           {/* 标题输入 - 移到顶部 */}
           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full bg-transparent text-center font-serif text-lg font-bold text-gray-800 placeholder:text-gray-300 outline-none"
                placeholder="未命名章节"
              />
           </div>

           <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-mono">{stripHtml(content).length} 字</span>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
                 <div className="w-5 h-5 border border-current rounded flex items-center justify-center">
                    <div className="w-3 h-2 border-b border-current"></div>
                 </div>
              </button>
           </div>
        </div>

        {/* 编辑器核心 */}
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto py-12 px-16 min-h-[calc(100%-4rem)] bg-white shadow-sm my-8 transition-all duration-300">
                <TiptapEditor 
                    content={content} 
                    onChange={handleContentChange} 
                    key={currentChapterId}
                />
            </div>
        </div>

        {/* 底部悬浮保存 */}
        <button
          onClick={handleSave}
          className="absolute bottom-8 right-8 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2"
        >
          <Save size={14} />
          {isSaved ? '已保存' : '保存'}
        </button>
      </div>
    </div>
  );
}
