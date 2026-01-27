import { Novel } from '@/types/novel';

export const USE_MOCK = false;

const STORAGE_KEY = 'novel-assistant-mock-data';

export const mockNovels: Novel[] = [
  {
    id: '1',
    title: '星际迷航：未知的边界',
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3BhY2V8ZW58MHx8MHx8fDA%3D',
    synopsis: '在遥远的未来，人类已经征服了银河系。然而，在未知的边缘，一种古老的力量正在苏醒...',
    wordCount: 125000,
    status: '连载中',
    createdAt: '2023-01-15',
    updatedAt: '2023-10-20 14:30',
    knowledgeBases: [
      { id: 'kb1', name: '世界观', tags: ['设定', '背景'] },
      { id: 'kb2', name: '角色', tags: ['人物'] }
    ],
    volumes: [
      {
        id: 'v1',
        title: '第一卷：启航',
        order: 1,
        isExpanded: true,
        chapters: [
          {
            id: 'c1',
            title: '第一章：觉醒',
            order: 1,
            currentVersionId: 'v1',
            versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    content: '这是第一章的内容...',
                    updatedAt: '2023-01-15 10:00'
                }
            ]
          },
          {
            id: 'c2',
            title: '第二章：危机',
            order: 2,
            currentVersionId: 'v1',
             versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    content: '这是第二章的内容...',
                    updatedAt: '2023-01-16 10:00'
                }
            ]
          }
        ]
      }
    ],
    orphanChapters: []
  },
  {
    id: '2',
    title: '魔法学徒的逆袭',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fG1hZ2ljfGVufDB8fDB8fHww',
    synopsis: '一个被认为没有魔法天赋的少年，意外获得了一本传说中的魔法书...',
    wordCount: 350000,
    status: '连载中',
    createdAt: '2023-05-10',
    updatedAt: '2023-11-05 09:15',
    volumes: [],
    orphanChapters: [
        {
            id: 'oc1',
            title: '序章',
            order: 0,
            currentVersionId: 'v1',
            versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    content: '这是序章的内容...',
                    updatedAt: '2023-05-10 10:00'
                }
            ]
        }
    ]
  },
  {
    id: '3',
    title: '都市最强战神',
    cover: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2l0eXxlbnwwfHwwfHx8MA%3D%3D',
    synopsis: '一代战神回归都市，发现女儿竟然住在狗窝...',
    wordCount: 2000000,
    status: '完结',
    createdAt: '2022-01-01',
    updatedAt: '2023-12-01 18:00',
    volumes: [],
    orphanChapters: []
  }
];

// Load from localStorage if available
if (typeof window !== 'undefined') {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                mockNovels.length = 0;
                mockNovels.push(...parsed);
            }
        }
    } catch (e) {
        console.error("Failed to load mock data", e);
    }
}

export const saveMockData = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockNovels));
    }
};

