export interface KnowledgeBase {
  id: string;
  name: string;
  tags: string[];
  content?: string;
}

export interface ChapterVersion {
  id: string;
  versionNumber: number;
  note?: string;
  content: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  versions: ChapterVersion[];
  currentVersionId: string;
  volumeId?: string;
  order: number;
}

export interface Volume {
  id: string;
  title: string;
  chapters: Chapter[];
  order: number;
  isExpanded: boolean;
}

export interface Novel {
  id: string;
  title: string;
  cover?: string;
  synopsis?: string;
  wordCount: number;
  status: '连载中' | '完结' | '断更';
  createdAt: string;
  updatedAt: string;
  knowledgeBases?: KnowledgeBase[];
  volumes?: Volume[];
  orphanChapters?: Chapter[];
}
