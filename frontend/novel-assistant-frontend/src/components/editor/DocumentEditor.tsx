import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Save, ChevronLeft, ChevronRight, ArrowLeft, Mail, ChevronDown, Plus, Trash2, FileText } from 'lucide-react';
import WorkDirectory from '../work-detail/WorkDirectory';
import TiptapEditor from './TiptapEditor';
import { getWorkDetail } from '@/services/workService';
import { 
    getDocumentDetail, 
    updateDocumentContent, 
    renameDocument,
    createFolder,
    deleteFolder,
    renameFolder,
    createDocument,
    deleteDocument,
    getDocumentVersions,
    createDocumentVersion,
    deleteDocumentVersion
} from '@/services/documentService';
import { Volume, Chapter } from '@/types/work';
import { DocumentVersionItem } from '@/services/models';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260131-01
 * 创建时间: 2026-01-20 22:05
 * 更新时间: 2026-01-31 14:20
 * 更新记录:
 * - [2026-01-31 14:20:FE-REF-20260131-01: 在何处使用: 编辑器页面；如何使用: 替换Novel为Work terminology；实现概述: 重命名所有变量、状态、接口引用，对接新的WorkService。]
 * - [2026-01-31 14:00:FE-REF-20260125-03: 在何处使用: 编辑器页面；如何使用: 完善版本管理；实现概述: 实现了版本列表获取、版本切换、新建版本功能；移除了邮箱图标；使用documentId加载数据。]
 * - [2026-01-25 11:30:FE-REF-20260125-02: 在何处使用: 编辑器页面；如何使用: 更新Props接受documentId；实现概述: 移除novelId props，改为内部获取；添加版本管理下拉框及创建新版本功能。]
 * - [2026-01-25 10:00:FE-REF-20260125-01: 在何处使用: 编辑器页面；如何使用: 集成 NovelDirectory；实现概述: 替换 TableOfContents 为 NovelDirectory，并实现 CRUD 回调函数。]
 */

const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>?/gm, '');
};


interface DocumentEditorProps {
  isChatExpanded: boolean;
  documentId: string | null;
  workId?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DocumentEditor({ isChatExpanded, documentId, workId: propWorkId }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('未命名文档');
  const [isSaved, setIsSaved] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(documentId);
  const [workId, setWorkId] = useState<string | null>(propWorkId || null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [orphanChapters, setOrphanChapters] = useState<Chapter[]>([]);
  const [version, setVersion] = useState<string>('latest');
  const [versionName, setVersionName] = useState<string>('');
  const [versionList, setVersionList] = useState<DocumentVersionItem[]>([]);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [isStructureLoaded, setIsStructureLoaded] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (propWorkId) {
        setWorkId(propWorkId);
    }
  }, [propWorkId]);
   const handleBack = async () => {
     if (!isSaved) {
         await handleSave();
     }
     if (workId) {
         router.push(`/works/${workId}`);
     } else {
         router.back();
     }
   };

  const refreshWorkStructure = useCallback(async () => {
    if (!workId) return;
    try {
        const work = await getWorkDetail(userId, workId);
        setVolumes(work.volumes || []);
        setOrphanChapters(work.orphanChapters || []);
        setIsStructureLoaded(true);
    } catch (err) {
        logger.error("Fetch work failed", err);
    }
  }, [workId]);

  useEffect(() => {
    refreshWorkStructure();
  }, [refreshWorkStructure]);

  // Validate currentChapterId against structure
  useEffect(() => {
      if (!isStructureLoaded || !currentChapterId) return;
      
      const existsInVolumes = volumes.some(v => v.chapters.some(c => c.id === currentChapterId));
      const existsInOrphans = orphanChapters.some(c => c.id === currentChapterId);
      
      if (!existsInVolumes && !existsInOrphans) {
           console.warn(`[DocumentEditor] Current chapter ${currentChapterId} not found in structure. Resetting.`);
           setCurrentChapterId(null);
           setContent('');
           setTitle('');
           
           // Clear URL params
           const params = new URLSearchParams(searchParams);
           if (params.has('version')) {
               params.delete('version');
               router.replace(`${pathname}?${params.toString()}`);
           }
      }
  }, [isStructureLoaded, volumes, orphanChapters, currentChapterId, pathname, router, searchParams]);

  // Fetch Version List
  const fetchVersions = useCallback(async () => {
      if (!workId || !currentChapterId) return;
      try {
          const versions = await getDocumentVersions(workId, currentChapterId);
          console.log('[DocumentEditor] Fetched versions:', versions);
          setVersionList(versions);
      } catch (e) {
          console.error('[DocumentEditor] Fetch versions failed', e);
          logger.error("Fetch versions failed", e);
      }
  }, [workId, currentChapterId]);

  useEffect(() => {
      if (isVersionDropdownOpen) {
          fetchVersions();
      }
  }, [isVersionDropdownOpen, fetchVersions]);


  // CRUD Handlers for Directory
  const handleCreateVolume = async (name: string) => {
      if (!workId) return;
      try {
          await createFolder({
              user_id: userId,
              work_id: workId,
              name: name || '新卷'
          });
          await refreshWorkStructure();
      } catch (e) {
          logger.error("Create volume failed", e);
      }
  };

  const handleCreateChapter = async (volumeId?: string, name?: string) => {
      if (!workId) return;
      try {
          const newDoc = await createDocument({
              user_id: userId,
              work_id: workId,
              title: name || '新章节',
              folder_id: volumeId
          });
          await refreshWorkStructure();
          // Optionally select the new chapter
          if (newDoc.id) {
              setCurrentChapterId(newDoc.id);
          }
      } catch (e) {
          logger.error("Create chapter failed", e);
      }
  };

  const handleUpdateVolume = async (volumeId: string, data: Partial<Volume>) => {
      if (!workId) return;
      try {
          if (data.title) {
              await renameFolder({
                  user_id: userId,
                  work_id: workId,
                  folder_id: volumeId,
                  name: data.title
              });
              await refreshWorkStructure();
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
      if (!workId) return;
      try {
          if (data.title) {
              await renameDocument({
                  user_id: userId,
                  work_id: workId,
                  document_id: chapterId,
                  title: data.title
              });
              // If renaming current chapter, update local title state too
              if (chapterId === currentChapterId) {
                  setTitle(data.title);
              }
              await refreshWorkStructure();
          }
      } catch (e) {
          logger.error("Update chapter failed", e);
      }
  };

  const handleDeleteVolume = async (volumeId: string) => {
      if (!workId) return;
      try {
          await deleteFolder({
              user_id: userId,
              work_id: workId,
              folder_id: volumeId
          });
          await refreshWorkStructure();
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
      if (!workId) return;
      try {
          await deleteDocument({
              user_id: userId,
              work_id: workId,
              document_id: chapterId
          });
          await refreshWorkStructure();
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
    const fetchDoc = async () => {
        if (!currentChapterId) return;

        // Get version from URL if available
        const versionParam = searchParams.get('version');
        console.log(`[DocumentEditor] Initial load, version from URL: ${versionParam}`);

        // If we have workId, we use it (standard path)
        // If we don't have workId, we try to fetch by documentId directly to get context
        const params = workId 
            ? { document_id: currentChapterId, user_id: userId, work_id: workId, version_id: versionParam || undefined }
            : { document_id: currentChapterId, user_id: userId, version_id: versionParam || undefined }; // work_id is optional now in service

        try {
            const detail = await getDocumentDetail(params);
            
            // If we didn't have workId, set it now from the document detail
            if (!workId && detail.work_id) {
                setWorkId(detail.work_id);
            }

            setContent(detail.document_body_text || '');
            setTitle(detail.document_title || '未命名文档');
            if (detail.document_version_id) setVersion(detail.document_version_id); // Use document_version_id mapped from backend
            
            // Prioritize version name from detail, but if it's 'latest' or matches ID, we might want to be careful
            // For display:
            if (detail.current_version_name) {
                 setVersionName(detail.current_version_name);
            } else if (versionParam) {
                 setVersionName(versionParam);
            }

            setIsSaved(true);
        } catch (err) {
            logger.error("Fetch document failed", err);
            // If fetch fails (e.g. 404), reset currentChapterId so we don't show invalid editor state
            // Only if we are sure it's a "not found" or similar fatal error.
            // For now, let's assume if we can't fetch it, we shouldn't show it.
            setCurrentChapterId(null);
            setContent('');
            setTitle('');
        }
    };

    fetchDoc();
  }, [currentChapterId, workId, searchParams]); // Dependencies

  const handleSwitchVersion = async (versionStr: string) => {
      console.log(`[DocumentEditor] Switching to version: ${versionStr}`);
      if (!isSaved) {
          await handleSave();
      }
      if (!workId || !currentChapterId) {
          console.warn('[DocumentEditor] Missing workId or currentChapterId');
          return;
      }
      try {
          const detail = await getDocumentDetail({
              document_id: currentChapterId,
              user_id: userId,
              work_id: workId,
              version_id: versionStr
          });
          console.log('[DocumentEditor] Version detail fetched:', detail);
          setContent(detail.document_body_text || '');
          setTitle(detail.document_title || '未命名文档');
          
          setVersion(versionStr); 
          setVersionName(versionStr); // Update version name explicitly
          setIsVersionDropdownOpen(false);
          
          // Update URL
          const params = new URLSearchParams(searchParams);
          params.set('version', versionStr);
          router.replace(`${pathname}?${params.toString()}`);
          
          logger.debug(`Switched to version ${versionStr}`);
      } catch (e) {
          console.error('[DocumentEditor] Switch version failed', e);
          logger.error("Switch version failed", e);
      }
  };

  const handleDeleteVersion = async (e: React.MouseEvent, versionStr: string) => {
      e.stopPropagation();
      if (!workId || !currentChapterId) return;
      if (!confirm('Are you sure you want to delete this version?')) return;
      
      try {
          await deleteDocumentVersion(workId, currentChapterId, versionStr);
          await fetchVersions();
          // If deleted current version, switch to latest or handle gracefully?
          // For now, if current version is deleted, we might be in an invalid state if we don't reload.
          // But usually we delete non-current versions.
          if (version === versionStr) {
              const detail = await getDocumentDetail({
                  document_id: currentChapterId,
                  user_id: userId,
                  work_id: workId
              });
              setVersion(detail.document_version_id || 'latest');
              setVersionName(detail.current_version_name || '');
              setContent(detail.document_body_text || '');
              setTitle(detail.document_title || '未命名文档');
              
              // Remove version param from URL as we reset to latest/default
              const params = new URLSearchParams(searchParams);
              params.delete('version');
              router.replace(`${pathname}?${params.toString()}`);
          }
          logger.info("Version deleted");
      } catch (err) {
          logger.error("Delete version failed", err);
      }
  };

  const submitNewVersion = async () => {
      if (!workId || !currentChapterId) return;
      try {
          if (!isSaved) {
             await handleSave();
          }

          // Create version with entered name (or undefined/empty)
          await createDocumentVersion({
              user_id: userId,
              work_id: workId,
              document_id: currentChapterId,
              version_name: newVersionName || undefined
          });
          
          await fetchVersions(); 
           const detail = await getDocumentDetail({
               document_id: currentChapterId,
               user_id: userId,
               work_id: workId
           });
           setVersion(detail.document_version_id || 'latest');
           setVersionName(detail.current_version_name || '');
           
           setIsVersionDropdownOpen(false);
           setIsCreatingVersion(false);
           setNewVersionName('');
           
           // Clear version param as new version creation might switch context or stay on latest logic
           // If the backend switches to the new version automatically, we might want to update URL to that new version
           // But here we just reset to what getDocumentDetail returns (likely the new version as current)
           if (detail.document_version_id && detail.document_version_id !== 'latest') {
               const params = new URLSearchParams(searchParams);
               params.set('version', detail.document_version_id);
               router.replace(`${pathname}?${params.toString()}`);
           }
           
          logger.info("New version created");
      } catch (e) {
          logger.error("Create version failed", e);
      }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };
  
  const handleTitleSave = async () => {
      if (!workId || !currentChapterId) return;
      try {
          await renameDocument({
              user_id: userId,
              work_id: workId,
              document_id: currentChapterId,
              title: title
          });
          
          await refreshWorkStructure();
          
          setIsSaved(true);
          logger.debug('标题保存成功');
      } catch (e) {
          logger.error("Title save failed", e);
      }
  };

  const handleSave = async () => {
    if (!workId || !currentChapterId) {
        logger.error("Missing workId or chapterId");
        return;
    }
    try {
        const updatedDoc = await updateDocumentContent({
            user_id: userId,
            work_id: workId,
            document_id: currentChapterId,
            version_id: version, 
            content: content
        });
        
        if (updatedDoc.now_version) {
            setVersion(updatedDoc.now_version);
            setVersionName(updatedDoc.now_version);
        }
        
        setIsSaved(true);
        logger.debug('保存文档成功:', { title, content, version: updatedDoc.current_version_id });
        
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



  // Auto-save logic
  useEffect(() => {
    if (isSaved || !currentChapterId) return;

    const timer = setTimeout(() => {
        logger.debug('Auto-saving...');
        handleSave();
    }, 2000); // 2 seconds auto-save

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title, isSaved, currentChapterId]);

  const [isTocCollapsed, setIsTocCollapsed] = useState(false);

  // New Layout Implementation
  return (
    <div className="flex h-full w-full bg-white relative">
      {/* 侧边栏目录 - 集成在编辑器左侧 */}
      <div className={`h-full border-r border-gray-100 bg-gray-50/30 flex flex-col relative z-10 transition-all duration-300 ease-in-out overflow-hidden ${isTocCollapsed ? 'w-0 border-none' : 'w-72'}`}>
        <div className={`${isTocCollapsed ? 'hidden' : 'block'} h-full w-full`}>
            <WorkDirectory 
                volumes={volumes} 
                orphanChapters={orphanChapters} 
                selectedChapterId={currentChapterId || undefined}
                onSelectChapter={async (chapter) => {
                    if (!isSaved) {
                        await handleSave();
                    }
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
              
              {/* Version Dropdown */}
              <div className="relative">
                 <button 
                    onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                    className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-full transition-all active:scale-95"
                    title="切换版本"
                 >
                     <span className={`w-2 h-2 rounded-full ${version === 'latest' ? 'bg-green-500' : 'bg-stone-800'}`}></span>
                     <span className="text-xs font-bold text-stone-700 uppercase tracking-wide max-w-[100px] truncate">
                        {(() => {
                            if (version === 'latest') return 'LATEST';
                            if (versionName) return versionName;
                            // Use find to get the version object and display its version name (v.version)
                            const v = versionList.find(i => i.version === version);
                            return v ? v.version : 'UNKNOWN'; 
                        })()}
                     </span>
                     <ChevronDown size={14} className={`text-stone-400 transition-transform ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {isVersionDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-stone-100 shadow-xl rounded-xl py-2 z-50 max-h-96 overflow-y-auto ring-1 ring-black/5">
                       <div className="px-4 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">History Versions</div>
                       {versionList.map((v) => (
                          <div 
                            key={v.id} 
                            onClick={() => handleSwitchVersion(v.version)}
                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer group/item ${v.version === version ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'}`}
                          >
                             <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[150px]">
                                    {v.version}
                                </span>
                                <span className={`text-[10px] ${v.version === version ? 'text-stone-400' : 'text-stone-400'}`}>
                                    {format(new Date(v.create_at), 'MM-dd HH:mm')}
                                </span>
                             </div>
                             <div className="flex items-center gap-2">
                                 {v.version === version && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                 <button
                                    onClick={(e) => handleDeleteVersion(e, v.version)}
                                    className={`p-1 rounded-md hover:bg-red-100 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all ${v.version === version ? 'text-stone-400 hover:text-red-400' : 'text-stone-400'}`}
                                    title="Delete Version"
                                 >
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                          </div>
                       ))}
                       
                       {versionList.length === 0 && (
                           <div className="px-4 py-3 text-xs text-stone-400 italic text-center">No history versions found</div>
                       )}

                       <div className="border-t border-stone-100 my-1 mx-2"></div>
                       {isCreatingVersion ? (
                           <div className="px-4 py-2.5">
                               <input 
                                   autoFocus
                                   className="w-full bg-stone-50 border-b border-stone-300 focus:border-stone-800 outline-none text-xs py-1"
                                   placeholder="输入版本名称 (回车创建)"
                                   value={newVersionName}
                                   onChange={(e) => setNewVersionName(e.target.value)}
                                   onKeyDown={(e) => {
                                       if (e.key === 'Enter') submitNewVersion();
                                       if (e.key === 'Escape') {
                                           setIsCreatingVersion(false);
                                           setNewVersionName('');
                                       }
                                   }}
                               />
                           </div>
                       ) : (
                           <button 
                             onClick={() => setIsCreatingVersion(true)}
                             className="w-full text-left px-4 py-2.5 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2 font-medium transition-colors"
                           >
                              <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
                                  <Plus size={14} />
                              </div>
                              Create New Version
                           </button>
                       )}
                    </div>
                 )}
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-mono">{stripHtml(content).length} 字</span>
           </div>
        </div>

        {/* Editor Area */}
        {currentChapterId ? (
            <>
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
                            key={`${currentChapterId}-${version}`}
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
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#fdfbf7] text-stone-400 select-none">
                <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mb-6 shadow-sm">
                     <FileText size={40} className="text-stone-300" />
                </div>
                <h3 className="text-xl font-serif font-medium text-stone-600 mb-2">开始您的创作之旅</h3>
                <p className="text-sm text-stone-400 max-w-xs text-center leading-relaxed">
                    请从左侧目录选择一个章节进行编辑，<br/>或者点击 "+" 号创建一个新章节
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
