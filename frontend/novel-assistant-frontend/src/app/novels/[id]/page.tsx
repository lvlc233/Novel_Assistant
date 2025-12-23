"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Novel, Volume, Chapter, ChapterVersion } from '@/types/novel';
import NovelHeader from '@/components/NovelDetail/NovelHeader';
import NovelDirectory from '@/components/NovelDetail/NovelDirectory';
import ChapterPreview from '@/components/NovelDetail/ChapterPreview';
import BottomInput from '@/components/base/BottomInput';

import { userId } from '@/services/mock';
import { getNovelDetail } from '@/services/novelService';

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
      } catch (err: any) {
        console.error('Error fetching novel detail:', err);
        setError(err.message || '获取小说详情失败');
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

  const handleCreateVolume = () => {
      // TODO: Call backend API
      const newVolume: Volume = {
          id: `vol-${Date.now()}`,
          title: '新建卷',
          order: volumes.length + 1,
          isExpanded: true,
          chapters: []
      };
      setVolumes([...volumes, newVolume]);
  };

  const handleCreateChapter = (volumeId?: string) => {
      // TODO: Call backend API
      const newChapter: Chapter = {
          id: `chap-${Date.now()}`,
          title: '新建章节',
          order: 0, 
          currentVersionId: 'v1',
          volumeId: volumeId,
          versions: [
              {
                  id: 'v1',
                  versionNumber: 1,
                  content: '',
                  updatedAt: new Date().toLocaleString(),
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
  };

  const handleUpdateVolume = (id: string, data: Partial<Volume>) => {
      // TODO: Call backend API
      setVolumes(volumes.map(v => v.id === id ? { ...v, ...data } : v));
  };

  const handleUpdateChapter = (id: string, data: Partial<Chapter>) => {
      // TODO: Call backend API
      // Check orphan first
      const isOrphan = orphanChapters.some(c => c.id === id);
      if (isOrphan) {
          setOrphanChapters(orphanChapters.map(c => c.id === id ? { ...c, ...data } : c));
      } else {
          setVolumes(volumes.map(v => ({
              ...v,
              chapters: v.chapters.map(c => c.id === id ? { ...c, ...data } : c)
          })));
      }
  };

  const handleEditContent = () => {
      if (selectedChapter) {
          console.log(`Navigating to edit chapter ${selectedChapter.id}`);
          router.push(`/editor?chapterId=${selectedChapter.id}`);
      }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  if (error || !novel) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <div className="text-red-500">{error || '小说不存在'}</div>
        <button onClick={() => router.push('/novels')} className="text-blue-500 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
        {/* Back Button */}
        <button 
            onClick={() => router.push('/novels')}
            className="absolute top-8 left-8 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-all shadow-sm text-sm font-medium"
        >
            ← 返回列表
        </button>

        <div className="w-full max-w-6xl flex flex-col gap-8 px-4 pb-24 pt-24 mx-auto">
            {/* Top Section */}
            <NovelHeader novel={novel} />

            {/* Middle Section */}
            <div className="flex gap-6 h-[600px]">
                {/* Directory */}
                <NovelDirectory 
                    volumes={volumes}
                    orphanChapters={orphanChapters}
                    selectedChapterId={selectedChapterId}
                    onSelectChapter={handleSelectChapter}
                    onCreateVolume={handleCreateVolume}
                    onCreateChapter={handleCreateChapter}
                    onUpdateVolume={handleUpdateVolume}
                    onUpdateChapter={handleUpdateChapter}
                />

                {/* Content Preview */}
                <ChapterPreview 
                    chapter={selectedChapter}
                    onEdit={handleEditContent}
                />
            </div>
        </div>

        {/* Bottom Input */}
        <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl">
            <BottomInput 
              position="static"
              placeholder="快速指令 / 询问 AI..."
              onSubmit={(val) => console.log('Doc Detail Input:', val)}
            />
          </div>
        </div>
    </div>
  );
}