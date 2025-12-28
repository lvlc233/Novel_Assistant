"use client";

import { useState, useRef, useEffect } from 'react';
import { Save } from 'lucide-react';
import TableOfContents from '../Table/TableOfContents';
import '../Table/table-of-contents.css';
import { getNovelDetail} from '@/services/novelService';
import {getDocumentDetail, updateDocumentContent, renameDocument } from '@/services/documentService';
import { Volume, Chapter } from '@/types/novel';
import { userId } from '@/services/mock';

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

  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (novelId) {
      getNovelDetail(userId, novelId).then(novel => {
        setVolumes(novel.volumes || []);
        setOrphanChapters(novel.orphanChapters || []);
      }).catch(err => console.error("Fetch novel failed", err));
    }
  }, [novelId]);

  useEffect(() => {
    if (currentChapterId) {
       getDocumentDetail({ document_id: currentChapterId }).then(detail => {
           setContent(detail.document_body_text || '');
           setTitle(detail.document_title || '未命名文档');
           // setVersion(detail.document_version_id || 'v1.0.0'); // Wait, backend returns DocumentDetailPinnedVersion which has document_version_id
           // Let's check detail object structure. It has document_version_id from backend.
           if (detail.document_version_id) setVersion(detail.document_version_id);
           setIsSaved(true);
       }).catch(err => console.error("Fetch document failed", err));
    }
  }, [currentChapterId]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
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
          console.log('标题保存成功');
      } catch (e) {
          console.error("Title save failed", e);
      }
  };

  const handleSave = async () => {
    if (!novelId || !currentChapterId) {
        console.error("Missing novelId or chapterId");
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
        console.log('保存文档成功:', { title, content, version: newVersionId });
        
        // Also ensure title is saved if it was changed
        await handleTitleSave();
        
    } catch (e) {
        console.error("Save failed", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };



  return (
    <div 
      className={`document-editor ${isChatExpanded ? 'chat-expanded' : 'chat-collapsed'}`}
      onKeyDown={handleKeyDown}
    >
      {/* 目录组件 */}
      <TableOfContents 
        volumes={volumes} 
        orphanChapters={orphanChapters} 
        onSelectChapter={setCurrentChapterId} 
      />
      
      {/* 编辑区域 */}
      <div className="document-content">
        <div className="document-header-container">
          {/* 左边版本号区域 */}
          <div className="header-left-spacer">
            <span className="version-info">
              {version}
            </span>
          </div>
          
          {/* 中间标题区域 */}
          <div className="document-title-wrapper">
            <div className="document-title">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="document-title-input"
                placeholder="输入小说标题..."
              />
            </div>
          </div>
          
          {/* 右边状态栏 */}
          <div className="status-right">
            <span className="word-count">
              字数: {content.length}
            </span>
            <span className="line-count">
              行数: {content.split('\n').length}
            </span>
            <span className={`save-status ${isSaved ? 'saved' : 'unsaved'}`}>
              {isSaved ? '已保存' : '未保存'}
            </span>
          </div>
        </div>
        
        {/* 文档内容 */}
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          className="document-textarea"
          placeholder="开始书写您的小说..."
          spellCheck={false}
        />
        
        {/* 悬浮保存按钮 - 右下角 */}
        <button
          onClick={handleSave}
          className="floating-save-button"
          aria-label="保存文档"
        >
          <Save size={16} />
          保存
        </button>
      </div>
    </div>
  );
}