import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ChevronLeft, ChevronRight, ArrowLeft, Mail } from 'lucide-react';
import NovelDirectory from '../novel-detail/NovelDirectory';
import TiptapEditor from './TiptapEditor';
import { getNovelDetail } from '@/services/novelService';
import { 
    getDocumentDetail, 
    updateDocumentContent, 
    renameDocument,
    createFolder,
    deleteFolder,
    renameFolder,
    createDocument,
    deleteDocument
} from '@/services/documentService';
import { Volume, Chapter } from '@/types/novel';
import { userId } from '@/services/mock';
import { logger } from '@/lib/logger';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260125-01
 * 创建时间: 2026-01-20 22:05
 * 更新时间: 2026-01-25 10:00
 * 更新记录:
 * - [2026-01-25 10:00:FE-REF-20260125-01: 在何处使用: 编辑器页面；如何使用: 集成 NovelDirectory；实现概述: 替换 TableOfContents 为 NovelDirectory，并实现 CRUD 回调函数。]
 */

const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>?/gm, '');
};


interface DocumentEditorProps {
  isChatExpanded: boolean;
  novelId?: string | null;
  initialChapterId?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DocumentEditor({ isChatExpanded, novelId, initialChapterId }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('未命名文档');
  const [isSaved, setIsSaved] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(initialChapterId || null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [orphanChapters, setOrphanChapters] = useState<Chapter[]>([]);
  const [version, setVersion] = useState<string>('v1.0.0');
  
  const router = useRouter();
   const handleBack = () => {
     if (novelId) {
         router.push(`/novels/${novelId}`);
     } else {
         router.back();
     }
   };

  const refreshNovelStructure = useCallback(async () => {
    if (!novelId) return;
    try {
        const novel = await getNovelDetail(userId, novelId);
        setVolumes(novel.volumes || []);
        setOrphanChapters(novel.orphanChapters || []);
    } catch (err) {
        logger.error("Fetch novel failed", err);
    }
  }, [novelId]);

  useEffect(() => {
    refreshNovelStructure();
  }, [refreshNovelStructure]);

  // CRUD Handlers for Directory
  const handleCreateVolume = async () => {
      if (!novelId) return;
      try {
          await createFolder({
              user_id: userId,
              novel_id: novelId,
              name: '新卷'
          });
          await refreshNovelStructure();
      } catch (e) {
          logger.error("Create volume failed", e);
      }
  };

  const handleCreateChapter = async (volumeId?: string) => {
      if (!novelId) return;
      try {
          const newDoc = await createDocument({
              user_id: userId,
              novel_id: novelId,
              title: '新章节',
              folder_id: volumeId
          });
          await refreshNovelStructure();
          // Optionally select the new chapter
          if (newDoc.node_id) {
              setCurrentChapterId(newDoc.node_id);
          }
      } catch (e) {
          logger.error("Create chapter failed", e);
      }
  };

  const handleUpdateVolume = async (volumeId: string, data: Partial<Volume>) => {
      if (!novelId) return;
      try {
          if (data.title) {
              await renameFolder({
                  user_id: userId,
                  novel_id: novelId,
                  folder_id: volumeId,
                  name: data.title
              });
              await refreshNovelStructure();
          }
          // Handle other updates like isExpanded locally or via another API if persisted
          if (data.isExpanded !== undefined) {
             setVolumes(prev => prev.map(v => v.id === volumeId ? { ...v, isExpanded: data.isExpanded as boolean } : v));
          }
      } catch (e) {
          logger.error("Update volume failed", e);
      }
  };

  const handleUpdateChapter = async (chapterId: string, data: Partial<Chapter>) => {
      if (!novelId) return;
      try {
          if (data.title) {
              await renameDocument({
                  user_id: userId,
                  novel_id: novelId,
                  document_id: chapterId,
                  title: data.title
              });
              // If renaming current chapter, update local title state too
              if (chapterId === currentChapterId) {
                  setTitle(data.title);
              }
              await refreshNovelStructure();
          }
      } catch (e) {
          logger.error("Update chapter failed", e);
      }
  };

  const handleDeleteVolume = async (volumeId: string) => {
      if (!novelId) return;
      try {
          await deleteFolder({
              user_id: userId,
              novel_id: novelId,
              folder_id: volumeId
          });
          await refreshNovelStructure();
          // If current chapter was in this volume, clear selection? 
          // Implementation detail: check if currentChapterId is in the deleted volume
          const vol = volumes.find(v => v.id === volumeId);
          if (vol && vol.chapters.some(c => c.id === currentChapterId)) {
              setCurrentChapterId(null);
              setContent('');
              setTitle('');
          }
      } catch (e) {
          logger.error("Delete volume failed", e);
      }
  };

  const handleDeleteChapter = async (chapterId: string) => {
      if (!novelId) return;
      try {
          await deleteDocument({
              user_id: userId,
              novel_id: novelId,
              document_id: chapterId
          });
          await refreshNovelStructure();
          if (chapterId === currentChapterId) {
              setCurrentChapterId(null);
              setContent('');
              setTitle('');
          }
      } catch (e) {
          logger.error("Delete chapter failed", e);
      }
  };

  useEffect(() => {
    if (currentChapterId && novelId) {
       getDocumentDetail({
         document_id: currentChapterId,
         user_id: userId,
         novel_id: novelId
       }).then(detail => {
           setContent(detail.document_body_text || '');
           setTitle(detail.document_title || '未命名文档');
           if (detail.document_version_id) setVersion(detail.document_version_id);
           setIsSaved(true);
       }).catch(err => logger.error("Fetch document failed", err));
    }
  }, [currentChapterId, novelId]);

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
          
          await refreshNovelStructure();
          
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
      <div className={`h-full border-r border-gray-100 bg-gray-50/30 flex flex-col relative z-10 transition-all duration-300 ease-in-out overflow-hidden ${isTocCollapsed ? 'w-0 border-none' : 'w-72'}`}>
        <div className={`${isTocCollapsed ? 'hidden' : 'block'} h-full w-full`}>
            <NovelDirectory 
                volumes={volumes} 
                orphanChapters={orphanChapters} 
                selectedChapterId={currentChapterId || undefined}
                onSelectChapter={(chapter) => {
                    setCurrentChapterId(chapter.id);
                    setContent('');
                    setTitle(chapter.title);
                }}
                onCreateVolume={handleCreateVolume}
                onCreateChapter={handleCreateChapter}
                onUpdateVolume={handleUpdateVolume}
                onUpdateChapter={handleUpdateChapter}
                onDeleteVolume={handleDeleteVolume}
                onDeleteChapter={handleDeleteChapter}
            />
        </div>
      </div>
      
      {/* Toggle Button for TOC */}
      <button 
        onClick={() => setIsTocCollapsed(!isTocCollapsed)}
        className={`absolute top-1/2 z-20 w-6 h-20 -translate-y-1/2 bg-white border border-l-0 border-gray-200 shadow-md flex items-center justify-center text-gray-400 hover:text-stone-800 hover:bg-gray-50 hover:shadow-lg rounded-r-xl transition-all duration-300 cursor-pointer group ${isTocCollapsed ? 'left-0' : 'left-72'}`}
        title={isTocCollapsed ? "展开目录" : "收起目录"}
      >
         {isTocCollapsed ? (
             <ChevronRight className="w-4 h-4 transition-transform group-hover:scale-125" />
         ) : (
             <ChevronLeft className="w-4 h-4 transition-transform group-hover:scale-125" />
         )}
      </button>

      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col h-full relative bg-gray-50/50" onKeyDown={handleKeyDown}>
        
        {/* 顶部工具栏 */}
        <div className="h-14 flex items-center justify-between px-8 pr-12 border-b border-gray-100 bg-white relative shrink-0">
           <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors group"
                title="返回详情页"
              >
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  <span className="text-sm font-medium">返回</span>
              </button>
              <div className="w-px h-4 bg-stone-200"></div>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-black"></span>
                 <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{version}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-mono">{stripHtml(content).length} 字</span>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black" title="消息通知">
                 <Mail className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-[#fdfbf7] relative">
            <div className="max-w-4xl mx-auto min-h-full bg-white shadow-sm my-8 px-8 py-12 cursor-text transition-colors duration-300">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => currentChapterId && handleUpdateChapter(currentChapterId, { title })}
                    className="w-full text-4xl font-serif font-bold text-center text-stone-900 border-none outline-none focus:outline-none focus:ring-0 ring-0 appearance-none placeholder:text-stone-300 bg-transparent mb-8"
                    placeholder="请输入章节标题"
                />
                
                <TiptapEditor 
                    key={currentChapterId}
                    content={content} 
                    onChange={handleContentChange} 
                    editable={!!currentChapterId}
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