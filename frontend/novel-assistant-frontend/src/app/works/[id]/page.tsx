"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { SlotInjector } from '@/components/common/SlotInjector';
import WorkPluginSettingsModal from '@/components/work-detail/WorkPluginSettingsModal';
import WorkSettingsModal from '@/components/work-detail/WorkSettingsModal';

import { Work, Volume, Chapter } from '@/types/work';
import WorkHeader from '@/components/work-detail/WorkHeader';
import WorkDirectory from '@/components/work-detail/WorkDirectory';
import ChapterPreview from '@/components/work-detail/ChapterPreview';
import BottomInput from '@/components/common/BottomInput';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { logger } from '@/lib/logger';

// userId is no longer needed for backend API but kept for function signature compatibility
const userId = "";

import { 
    createFolder,
    createDocument,
    renameFolder,
    renameDocument,
    deleteFolder,
    deleteDocument,
    getDocumentDetail,
    getDocumentVersions
} from '@/services/documentService';
import {
    getWorkDetail
} from '@/services/workService';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260131-01
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-31 14:30
 * 更新记录:
 * - [2026-01-31 14:30:FE-REF-20260131-01: 优化作品详情页布局，缩小头部区域，增加内容区域占比，统一卡片风格。]
 * - [2026-01-31 10:00:FE-REF-20260126-03: 重构为 Work 术语，移除 mock 依赖]
 */

//  作品详情页
export default function WorkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [work, setWork] = useState<Work | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [orphanChapters, setOrphanChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Plugin Settings
  const [isPluginSettingsOpen, setIsPluginSettingsOpen] = useState(false);
  const [isWorkSettingsOpen, setIsWorkSettingsOpen] = useState(false);

  useEffect(() => {
    const fetchWorkDetail = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        // userId is not used by backend
        const data = await getWorkDetail(userId, id);
        setWork(data);
        setVolumes(data.volumes || []);
        setOrphanChapters(data.orphanChapters || []);
        
        // Default select first chapter if available
        if (data.volumes && data.volumes.length > 0 && data.volumes[0].chapters.length > 0) {
            setSelectedChapterId(data.volumes[0].chapters[0].id);
        } else if (data.orphanChapters && data.orphanChapters.length > 0) {
            setSelectedChapterId(data.orphanChapters[0].id);
        }
      } catch (err: unknown) {
        logger.error('Error fetching work detail:', err);
        const message = err instanceof Error ? err.message : '获取作品详情失败';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkDetail();
  }, [id]);

  // Helper to find chapter by ID
  const findChapter = (id?: string): Chapter | undefined => {
      if (!id) return undefined;
      const orphan = orphanChapters.find(c => c.id === id);
      if (orphan) return orphan;
      
      for (const vol of volumes) {
          const found = vol.chapters.find(c => c.id === id);
          if (found) return found;
      }
      return undefined;
  };

  const selectedChapter = findChapter(selectedChapterId);

  // Effect to fetch chapter details (content & versions) when selected
  useEffect(() => {
    const fetchChapterInfo = async () => {
        if (!selectedChapterId || !work) return;

        const currentChapter = findChapter(selectedChapterId);
        // Optimization: If content is already loaded (length > 0) and we have versions, maybe skip?
        // But for now, we want to ensure we have the version list which initial load doesn't give.
        // Initial load gives versions: [{id: 'v1', ...}] with empty content.
        
        try {
            // 1. Fetch Content (Current Version)
            const detail = await getDocumentDetail({
                work_id: id,
                document_id: selectedChapterId
            });

            // 2. Fetch Version List
            const versionsList = await getDocumentVersions(id, selectedChapterId);

            // 3. Merge Data
            const updatedVersions = versionsList.map(v => ({
                id: v.id,
                version: v.version,
                updatedAt: v.create_at,
                content: v.id === detail.document_version_id ? (detail.document_body_text || '') : '',
                versionNumber: parseInt(v.version.replace(/[^0-9.]/g, '')) || 1 // Simple parse
            }));

            // If the fetched detail version is not in the list (shouldn't happen usually), add it?
            // Or just ensure the current version in state has content.
            
            // Construct updates
            const updates: Partial<Chapter> = {
                currentVersionId: detail.document_version_id || 'v1',
                currentVersionName: detail.current_version_name || detail.document_version_id,
                versions: updatedVersions
            };

            // Update State
            setOrphanChapters(prev => prev.map(c => c.id === selectedChapterId ? { ...c, ...updates } : c));
            setVolumes(prev => prev.map(v => ({
                ...v,
                chapters: v.chapters.map(c => c.id === selectedChapterId ? { ...c, ...updates } : c)
            })));

        } catch (err) {
            logger.error('Failed to fetch chapter details:', err);
        }
    };

    fetchChapterInfo();
  }, [selectedChapterId, id]); // Depend on ID, not the object to avoid loops

  // Actions
  const handleSelectChapter = (chapter: Chapter) => {
      setSelectedChapterId(chapter.id);
  };

  const handleCreateVolume = async (name: string) => {
      try {
          const newFolder = await createFolder({
              user_id: userId,
              work_id: id,
              name: name
          });
          
          const newVolume: Volume = {
              id: newFolder.id,
              title: newFolder.name,
              order: volumes.length,
              isExpanded: true,
              chapters: []
          };
          setVolumes([...volumes, newVolume]);
      } catch (e) {
          logger.error('Create folder failed', e);
      }
  };

  const handleCreateChapter = async (volumeId?: string, name?: string) => {
      try {
          const newDoc = await createDocument({
              user_id: userId,
              work_id: id,
              title: name || '新建章节',
              folder_id: volumeId
          });

          const versionId = newDoc.current_version_id || 'v1';
          const versionName = newDoc.now_version || 'v1.0.0';

          const newChapter: Chapter = {
              id: newDoc.id,
              title: newDoc.name,
              order: 0,
              currentVersionId: versionId,
              currentVersionName: versionName,
              volumeId: volumeId,
              versions: [
                  {
                      id: versionId,
                      version: versionName,
                      content: '',
                      updatedAt: new Date().toISOString(),
                      note: '初始版本'
                  }
              ]
          };

          if (volumeId) {
              setVolumes(volumes.map(v => {
                  if (v.id === volumeId) {
                      return { ...v, chapters: [...v.chapters, newChapter] };
                  }
                  return v;
              }));
          } else {
              setOrphanChapters([...orphanChapters, newChapter]);
          }
          // Auto select
          setSelectedChapterId(newChapter.id);
          return { id: newChapter.id, title: newChapter.title };
      } catch (e) {
          logger.error('Create document failed', e);
      }
  };

  const handleUpdateVolume = async (id: string, data: Partial<Volume>) => {
      // Optimistic update
      setVolumes(volumes.map(v => v.id === id ? { ...v, ...data } : v));

      // If title changed, call backend
      if (data.title) {
          try {
             await renameFolder({
                 user_id: userId,
                 work_id: params.id as string,
                 folder_id: id,
                 name: data.title
             });
          } catch (e) {
              logger.error('Rename folder failed', e);
          }
      }
  };

  const handleUpdateChapter = async (id: string, data: Partial<Chapter>) => {
      // Optimistic update
      const isOrphan = orphanChapters.some(c => c.id === id);
      if (isOrphan) {
          setOrphanChapters(orphanChapters.map(c => c.id === id ? { ...c, ...data } : c));
      } else {
          setVolumes(volumes.map(v => ({
              ...v,
              chapters: v.chapters.map(c => c.id === id ? { ...c, ...data } : c)
          })));
      }

      // If title changed, call backend
      if (data.title) {
          try {
             await renameDocument({
                 user_id: userId,
                 work_id: params.id as string,
                 document_id: id,
                 title: data.title
             });
          } catch (e) {
              logger.error('Rename document failed', e);
          }
      }
  };

  const handleDeleteVolume = async (volumeId: string) => {
      try {
          await deleteFolder({
              user_id: userId,
              work_id: id,
              folder_id: volumeId
          });
          setVolumes(volumes.filter(v => v.id !== volumeId));
          // If selected chapter was in deleted volume, clear selection
          if (selectedChapter && selectedChapter.volumeId === volumeId) {
              setSelectedChapterId(undefined);
          }
      } catch (e) {
          logger.error('Delete volume failed', e);
      }
  };

  const handleDeleteChapter = async (chapterId: string) => {
      try {
          await deleteDocument({
              user_id: userId,
              work_id: id,
              document_id: chapterId
          });
          
          const isOrphan = orphanChapters.some(c => c.id === chapterId);
          if (isOrphan) {
              setOrphanChapters(orphanChapters.filter(c => c.id !== chapterId));
          } else {
              setVolumes(volumes.map(v => ({
                  ...v,
                  chapters: v.chapters.filter(c => c.id !== chapterId)
              })));
          }

          if (selectedChapterId === chapterId) {
              setSelectedChapterId(undefined);
          }
      } catch (e) {
          logger.error('Delete chapter failed', e);
      }
  };

  const handleEditContent = () => {
      if (selectedChapter) {
          logger.debug('Navigating to edit chapter', selectedChapter.id);
          router.push(`/editor?workId=${id}&initialChapterId=${selectedChapter.id}`);
      }
  };

  const handleSelectVersion = async (versionId: string) => {
      if (!selectedChapterId || !work) return;

      try {
          // 1. Fetch content for specific version
          const detail = await getDocumentDetail({
              work_id: id,
              document_id: selectedChapterId,
              version_id: versionId
          });

          // 2. Update State with new content and set as current (for viewing)
          const updates: Partial<Chapter> = {
              currentVersionId: versionId,
              currentVersionName: detail.current_version_name || detail.document_version_id,
              // Update content for this version in the list
              versions: selectedChapter?.versions.map(v => 
                  v.id === versionId ? { ...v, content: detail.document_body_text || '' } : v
              ) || []
          };
          
          setOrphanChapters(prev => prev.map(c => c.id === selectedChapterId ? { ...c, ...updates } : c));
          setVolumes(prev => prev.map(v => ({
              ...v,
              chapters: v.chapters.map(c => c.id === selectedChapterId ? { ...c, ...updates } : c)
          })));
      } catch (e) {
          logger.error('Failed to switch version', e);
      }
  };

  if (isLoading) {
    return (
        <AppLayout>
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
            </div>
        </AppLayout>
    );
  }

  if (error || !work) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full flex-col gap-4">
            <div className="text-red-500">{error || '作品不存在'}</div>
            <button onClick={() => router.push('/works')} className="text-stone-500 hover:underline">
            返回列表
            </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        {/* Inject Header Content */}
        <SlotInjector slotId="header-breadcrumb">
             <div className="flex items-center gap-2">
                 <button 
                     onClick={() => router.push('/works')}
                     className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                 >
                     <ArrowLeft className="w-4 h-4" />
                     作品列表
                 </button>
                 <span className="text-text-disabled">/</span>
                 <span className="font-serif font-bold text-text-primary">{work.title}</span>
             </div>
        </SlotInjector>

        <SlotInjector slotId="header-actions">
            <button 
                onClick={() => setIsPluginSettingsOpen(true)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
                title="插件配置"
            >
                <Settings2 className="w-5 h-5" />
            </button>
        </SlotInjector>

        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 h-full">
                    
                    {/* Novel Info Header */}
                    <div className="shrink-0">
                        <WorkHeader work={work} onEdit={() => setIsWorkSettingsOpen(true)} />
                    </div>

                    {/* Workspace (Directory + Preview) */}
                    <div className="flex-1 flex gap-4 min-h-0 pb-20 overflow-hidden">
                        {/* Directory Panel */}
                        <div className="shrink-0 h-full w-80 flex flex-col shadow-sm rounded-xl border border-stone-200 bg-white overflow-hidden">
                            <WorkDirectory 
                                volumes={volumes}
                                orphanChapters={orphanChapters}
                                selectedChapterId={selectedChapterId}
                                onSelectChapter={handleSelectChapter}
                                onCreateVolume={handleCreateVolume}
                                onCreateChapter={handleCreateChapter}
                                onUpdateVolume={handleUpdateVolume}
                                onUpdateChapter={handleUpdateChapter}
                                onDeleteVolume={handleDeleteVolume}
                                onDeleteChapter={handleDeleteChapter}
                            />
                        </div>

                        {/* Preview Panel */}
                        <div className="flex-1 h-full min-w-0 flex flex-col">
                            <ChapterPreview 
                                chapter={selectedChapter}
                                onEdit={handleEditContent}
                                onSelectVersion={handleSelectVersion}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部输入框 */}
            <div className="fixed bottom-8 left-64 right-0 z-50 flex justify-center px-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-2xl shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 bg-surface-white">
                <BottomInput 
                  position="static"
                  placeholder="询问 AI 助手或快速创建..."
                  onSubmit={(val) => logger.debug('Doc Detail Input:', val)}
                />
              </div>
            </div>
        </div>
        
        <WorkPluginSettingsModal 
            isOpen={isPluginSettingsOpen} 
            onClose={() => setIsPluginSettingsOpen(false)}
            workId={id}
        />

        {work && (
            <WorkSettingsModal
                isOpen={isWorkSettingsOpen}
                onClose={() => setIsWorkSettingsOpen(false)}
                work={work}
                onUpdate={(updated) => setWork(updated)}
            />
        )}
    </AppLayout>
  );
}
