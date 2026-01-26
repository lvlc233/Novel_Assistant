"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { SlotInjector } from '@/components/common/SlotInjector';
import NovelPluginSettingsModal from '@/components/novel-detail/NovelPluginSettingsModal';
import NovelSettingsModal from '@/components/novel-detail/NovelSettingsModal';

import { Novel, Volume, Chapter } from '@/types/novel';
import NovelHeader from '@/components/novel-detail/NovelHeader';
import NovelDirectory from '@/components/novel-detail/NovelDirectory';
import ChapterPreview from '@/components/novel-detail/ChapterPreview';
import BottomInput from '@/components/common/BottomInput';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { logger } from '@/lib/logger';

import { userId } from '@/services/mock';
import { 
    createFolder,
    createDocument,
    renameFolder,
    renameDocument,
    deleteFolder,
    deleteDocument
} from '@/services/documentService';
import {
    getNovelDetail
} from '@/services/novelService';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260125-03
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-25 12:30
 * 更新记录:
 * - [2026-01-25 12:30:FE-REF-20260125-03: 接入 AppLayout, 添加插件配置入口]
 * - [2026-01-20 21:40:FE-REF-20260120-01: 在何处使用: /novels/[id] 作品详情；如何使用: 进入页面拉取详情/目录操作；实现概述: 移除直接 console 输出，统一走 logger，并收口错误信息到页面状态。]
 */

//  小说详情页
export default function NovelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [orphanChapters, setOrphanChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Plugin Settings
  const [isPluginSettingsOpen, setIsPluginSettingsOpen] = useState(false);
  const [isNovelSettingsOpen, setIsNovelSettingsOpen] = useState(false);

  useEffect(() => {
    const fetchNovelDetail = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await getNovelDetail(userId, id);
        setNovel(data);
        setVolumes(data.volumes || []);
        setOrphanChapters(data.orphanChapters || []);
        
        // Default select first chapter if available
        if (data.volumes && data.volumes.length > 0 && data.volumes[0].chapters.length > 0) {
            setSelectedChapterId(data.volumes[0].chapters[0].id);
        } else if (data.orphanChapters && data.orphanChapters.length > 0) {
            setSelectedChapterId(data.orphanChapters[0].id);
        }
      } catch (err: unknown) {
        logger.error('Error fetching novel detail:', err);
        const message = err instanceof Error ? err.message : '获取小说详情失败';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovelDetail();
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

  // Actions
  const handleSelectChapter = (chapter: Chapter) => {
      setSelectedChapterId(chapter.id);
  };

  const handleCreateVolume = async () => {
      try {
          const newFolder = await createFolder({
              user_id: userId,
              novel_id: id,
              name: '新建卷'
          });
          
          const newVolume: Volume = {
              id: newFolder.node_id,
              title: newFolder.node_name,
              order: newFolder.sort_order,
              isExpanded: true,
              chapters: []
          };
          setVolumes([...volumes, newVolume]);
      } catch (e) {
          logger.error('Create folder failed', e);
      }
  };

  const handleCreateChapter = async (volumeId?: string) => {
      try {
          const newDoc = await createDocument({
              user_id: userId,
              novel_id: id,
              title: '新建章节',
              folder_id: volumeId
          });

          const newChapter: Chapter = {
              id: newDoc.node_id,
              title: newDoc.node_name,
              order: newDoc.sort_order,
              currentVersionId: 'v1',
              volumeId: volumeId,
              versions: [
                  {
                      id: 'v1',
                      versionNumber: 1,
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
                 novel_id: params.id as string,
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
                 novel_id: params.id as string,
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
              novel_id: id,
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
              novel_id: id,
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
          router.push(`/editor?novelId=${id}&initialChapterId=${selectedChapter.id}`);
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

  if (error || !novel) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full flex-col gap-4">
            <div className="text-red-500">{error || '小说不存在'}</div>
            <button onClick={() => router.push('/novels')} className="text-stone-500 hover:underline">
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
                     onClick={() => router.push('/novels')}
                     className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                 >
                     <ArrowLeft className="w-4 h-4" />
                     书架
                 </button>
                 <span className="text-text-disabled">/</span>
                 <span className="font-serif font-bold text-text-primary">{novel.title}</span>
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
                <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 h-full">
                    
                    {/* Novel Info Header - Simplified in Detail Page since we have TopNav now? 
                        Maybe keep it for cover and stats. 
                    */}
                    <div className="shrink-0">
                        <NovelHeader novel={novel} />
                    </div>

                    {/* Workspace (Directory + Preview) */}
                    <div className="flex-1 flex gap-6 min-h-0 pb-20">
                        {/* Directory Panel */}
                        <div className="shrink-0 h-full w-80">
                            <NovelDirectory 
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
                        <div className="flex-1 h-full min-w-0">
                            <ChapterPreview 
                                chapter={selectedChapter}
                                onEdit={handleEditContent}
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
        
        <NovelPluginSettingsModal 
            isOpen={isPluginSettingsOpen} 
            onClose={() => setIsPluginSettingsOpen(false)}
            novelId={id}
        />

        {novel && (
            <NovelSettingsModal
                isOpen={isNovelSettingsOpen}
                onClose={() => setIsNovelSettingsOpen(false)}
                novel={novel}
                onUpdate={(updated) => setNovel(updated)}
            />
        )}
    </AppLayout>
  );
}
