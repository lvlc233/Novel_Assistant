"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Novel, Volume, Chapter, ChapterVersion } from '@/types/novel';
import NovelHeader from '@/components/NovelDetail/NovelHeader';
import NovelDirectory from '@/components/NovelDetail/NovelDirectory';
import ChapterPreview from '@/components/NovelDetail/ChapterPreview';
import BottomInput from '@/components/base/BottomInput';

// Mock Data
const MOCK_NOVEL: Novel = {
  id: '1',
  title: '星际迷航：未知的边界',
  cover: '',
  synopsis: '在遥远的未来，人类探索宇宙的边缘。主角杰克·雷诺是一艘名为“探索者号”的星际飞船的舰长。他们在一次常规巡逻中，意外发现了一个未知的虫洞，通往一个从未被记录的星系。在这里，他们遇到了名为“泽尔”的高等智慧种族，以及潜伏在暗处的宇宙海盗。杰克必须带领他的船员，在这个充满危险和机遇的新世界中生存下去，并解开关于古老文明的谜团。',
  wordCount: 12500,
  status: '连载中',
  createdAt: '2023-01-15',
  updatedAt: '2023-10-24 14:30',
  knowledgeBases: [],
};

const MOCK_VOLUMES: Volume[] = [
    {
        id: 'vol-1',
        title: '第一卷：初入星河',
        order: 1,
        isExpanded: true,
        chapters: [
            {
                id: 'chap-1',
                title: '第一章：启航',
                order: 1,
                volumeId: 'vol-1',
                currentVersionId: 'v1',
                versions: [
                    {
                        id: 'v1',
                        versionNumber: 1,
                        content: '星历3024年，地球联邦最大的星港——天穹港。巨大的金属结构悬浮在地球同步轨道上，无数飞船如同萤火虫般穿梭其间。杰克站在探索者号的舰桥上，透过巨大的透明舷窗，注视着下方蔚蓝的母星。\n\n“舰长，所有系统自检完毕，引擎预热完成。”副官艾丽莎的声音在耳边响起。\n\n杰克深吸一口气，整理了一下制服的领口，沉声道：“出发。”\n\n随着引擎的轰鸣，探索者号缓缓脱离泊位，化作一道流光，冲向深邃的宇宙。这次的任务是前往银河系边缘的K-7星区进行勘测，那里是联邦疆域的最前线，也是充满了未知危险的区域。',
                        updatedAt: '2023-01-16 10:00',
                        note: '初稿'
                    }
                ]
            },
            {
                id: 'chap-2',
                title: '第二章：异常信号',
                order: 2,
                volumeId: 'vol-1',
                currentVersionId: 'v1',
                versions: [
                    {
                        id: 'v1',
                        versionNumber: 1,
                        content: '飞船进入曲速航行已经三天了。除了单调的星光，周围什么都没有。雷达员小李正百无聊赖地盯着屏幕，突然，一个微弱的信号跳动了一下。\n\n“长官！发现异常信号！”小李大声喊道。\n\n杰克立刻走到雷达台前：“方位？”\n\n“前方三光年处，信号特征……不匹配任何已知文明。”',
                        updatedAt: '2023-01-18 14:20',
                        note: '初稿'
                    }
                ]
            }
        ]
    }
];

const MOCK_ORPHAN_CHAPTERS: Chapter[] = [
    {
        id: 'chap-draft',
        title: '草稿：关于外星种族的设想',
        order: 1,
        currentVersionId: 'v1',
        versions: [
             {
                id: 'v1',
                versionNumber: 1,
                content: '泽尔族：拥有心灵感应能力，皮肤呈淡蓝色，居住在水晶构成的城市中。',
                updatedAt: '2023-01-20',
                note: '随笔'
             }
        ]
    }
];

export default function NovelDetailPage() {
  const router = useRouter();
  const [novel, setNovel] = useState<Novel>(MOCK_NOVEL);
  const [volumes, setVolumes] = useState<Volume[]>(MOCK_VOLUMES);
  const [orphanChapters, setOrphanChapters] = useState<Chapter[]>(MOCK_ORPHAN_CHAPTERS);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>('chap-1');

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
      const newChapter: Chapter = {
          id: `chap-${Date.now()}`,
          title: '新建章节',
          order: 0, // Simplified order logic
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
      setVolumes(volumes.map(v => v.id === id ? { ...v, ...data } : v));
  };

  const handleUpdateChapter = (id: string, data: Partial<Chapter>) => {
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

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col items-center py-8 animate-fade-in relative">
        {/* Back Button */}
        <button 
            onClick={() => router.push('/documents')}
            className="absolute top-8 left-8 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-all shadow-sm text-sm font-medium"
        >
            ← 返回列表
        </button>

        <div className="w-full max-w-6xl flex flex-col gap-8 px-4 pb-24">
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