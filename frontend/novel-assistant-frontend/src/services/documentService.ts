import { request } from '@/lib/request';
import { NodeDTO } from '@/services/models';
import { mockNovels, USE_MOCK, saveMockData } from '@/services/mockData';
import { Chapter } from '@/types/novel';

/**
 * Service for managing documents and folders (nodes).
 * Aligned with backend /nodes endpoints.
 */

// Types matching backend
export interface CreateNodeRequest {
  parent_id?: string | null;
  node_name: string;
  node_type: 'document' | 'folder';
}

export interface UpdateNodeRequest {
  node_name?: string;
  content?: string;
  parent_id?: string | null;
}

export interface NodeDetailResponse {
  node_id: string;
  node_name: string;
  content?: string;
  node_type: 'document' | 'folder';
  word_count: number;
}

// Frontend DTOs (keeping existing interfaces where possible for compatibility)

export interface CreateFolderDto {
  user_id?: string; // Ignored by backend
  novel_id: string;
  name: string;
}

export async function createFolder(data: CreateFolderDto): Promise<NodeDTO> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel) {
            const newVolume = {
                id: `mock-vol-${crypto.randomUUID()}`,
                title: data.name,
                order: (novel.volumes?.length || 0) + 1,
                isExpanded: true,
                chapters: []
            };
            novel.volumes = novel.volumes || [];
            if (!novel.volumes.find(v => v.id === newVolume.id)) {
                novel.volumes.push(newVolume);
            }
            saveMockData();
            return {
                node_id: newVolume.id,
                node_name: newVolume.title,
                node_type: 'folder',
                sort_order: newVolume.order,
                parent_id: null
            };
        }
        throw new Error('Novel not found');
    }
    
    const response = await request.post<NodeDetailResponse>(`/works/${data.novel_id}/nodes`, {
      node_name: data.name,
      node_type: 'folder'
    });
    
    return {
      node_id: response.node_id,
      node_name: response.node_name,
      node_type: response.node_type,
      sort_order: 0, // Backend might not return sort_order in NodeDetailResponse, strictly speaking it's in NodeDTO
      parent_id: null
    };
}

export interface DeleteFolderDto {
  user_id?: string;
  novel_id: string;
  folder_id: string;
}

export async function deleteFolder(data: DeleteFolderDto): Promise<boolean> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel && novel.volumes) {
            novel.volumes = novel.volumes.filter(v => v.id !== data.folder_id);
            saveMockData();
            return true;
        }
        return false;
    }
    await request.delete(`/nodes/${data.folder_id}`);
    return true;
}

export interface RenameFolderDto {
    user_id?: string;
    novel_id: string;
    folder_id: string;
    name: string;
}

export async function renameFolder(data: RenameFolderDto): Promise<string> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel && novel.volumes) {
            const vol = novel.volumes.find(v => v.id === data.folder_id);
            if (vol) {
                vol.title = data.name;
                saveMockData();
                return data.name;
            }
        }
        throw new Error('Folder not found');
    }
    const response = await request.patch<NodeDetailResponse>(`/nodes/${data.folder_id}`, {
      node_name: data.name
    });
    return response.node_name;
}

export interface CreateDocumentDto {
    user_id?: string;
    novel_id: string;
    title: string;
    folder_id?: string | null;
}

export async function createDocument(data: CreateDocumentDto): Promise<NodeDTO> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel) {
            const newChapter = {
                id: `mock-chap-${crypto.randomUUID()}`,
                title: data.title,
                order: 1,
                currentVersionId: 'v1',
                versions: [{ id: 'v1', versionNumber: 1, content: '', updatedAt: new Date().toISOString() }]
            };

            if (data.folder_id) {
                const vol = novel.volumes?.find(v => v.id === data.folder_id);
                if (vol) {
                    newChapter.order = (vol.chapters?.length || 0) + 1;
                    vol.chapters.push(newChapter);
                } else {
                    throw new Error('Folder not found');
                }
            } else {
                 newChapter.order = (novel.orphanChapters?.length || 0) + 1;
                 novel.orphanChapters = novel.orphanChapters || [];
                 novel.orphanChapters.push(newChapter);
            }
             saveMockData();
             return {
                node_id: newChapter.id,
                node_name: newChapter.title,
                node_type: 'document',
                sort_order: newChapter.order,
                parent_id: data.folder_id
            };
        }
        throw new Error('Novel not found');
    }
    
    const response = await request.post<NodeDetailResponse>(`/works/${data.novel_id}/nodes`, {
      node_name: data.title,
      node_type: 'document',
      parent_id: data.folder_id
    });

    return {
      node_id: response.node_id,
      node_name: response.node_name,
      node_type: response.node_type,
      sort_order: 0,
      parent_id: data.folder_id
    };
}

export interface DeleteDocumentDto {
    user_id?: string;
    novel_id: string;
    document_id: string;
}

export async function deleteDocument(data: DeleteDocumentDto): Promise<boolean> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel) {
            // Check volumes
            if (novel.volumes) {
                for (const vol of novel.volumes) {
                     if (vol.chapters.some(c => c.id === data.document_id)) {
                         vol.chapters = vol.chapters.filter(c => c.id !== data.document_id);
                         return true;
                     }
                }
            }
            // Check orphan chapters
            if (novel.orphanChapters) {
                 if (novel.orphanChapters.some(c => c.id === data.document_id)) {
                     novel.orphanChapters = novel.orphanChapters.filter(c => c.id !== data.document_id);
                     return true;
                 }
            }
        }
        return false;
    }
    await request.delete(`/nodes/${data.document_id}`);
    return true;
}

export interface RenameDocumentDto {
    user_id?: string;
    novel_id: string;
    document_id: string;
    title: string;
}

export async function renameDocument(data: RenameDocumentDto): Promise<string> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel) {
            // Check volumes
            if (novel.volumes) {
                for (const vol of novel.volumes) {
                     const chap = vol.chapters.find(c => c.id === data.document_id);
                     if (chap) {
                         chap.title = data.title;
                         saveMockData();
                         return data.title;
                     }
                }
            }
             // Check orphan chapters
            if (novel.orphanChapters) {
                 const chap = novel.orphanChapters.find(c => c.id === data.document_id);
                 if (chap) {
                     chap.title = data.title;
                     saveMockData();
                     return data.title;
                 }
            }
        }
        throw new Error('Document not found');
    }
    const response = await request.patch<NodeDetailResponse>(`/nodes/${data.document_id}`, {
      node_name: data.title
    });
    return response.node_name;
}

export interface GetDocumentDetailDto {
    user_id?: string;
    document_id: string;
    version_id?: string;
}

export interface DocumentDetailResponse {
    document_id: string;
    document_version_id: string;
    document_title: string;
    document_body_text: string | null;
    document_word_count: number;
}

export async function getDocumentDetail(data: GetDocumentDetailDto): Promise<DocumentDetailResponse> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        for (const novel of mockNovels) {
            // Check volumes
            if (novel.volumes) {
                for (const vol of novel.volumes) {
                    const chap = vol.chapters.find(c => c.id === data.document_id);
                    if (chap) {
                        const version = chap.versions.find(v => v.id === (data.version_id || chap.currentVersionId));
                        return {
                            document_id: chap.id,
                            document_version_id: version?.id || 'v1',
                            document_title: chap.title,
                            document_body_text: version?.content || '',
                            document_word_count: (version?.content || '').length
                        };
                    }
                }
            }
             // Check orphan chapters
            if (novel.orphanChapters) {
                 const chap = novel.orphanChapters.find(c => c.id === data.document_id);
                 if (chap) {
                    const version = chap.versions.find(v => v.id === (data.version_id || chap.currentVersionId));
                    return {
                        document_id: chap.id,
                        document_version_id: version?.id || 'v1',
                        document_title: chap.title,
                        document_body_text: version?.content || '',
                        document_word_count: (version?.content || '').length
                    };
                 }
            }
        }
        throw new Error('Document not found');
    }
    
    const response = await request.get<NodeDetailResponse>(`/nodes/${data.document_id}`);
    return {
      document_id: response.node_id,
      document_version_id: 'latest', // Backend versioning not fully exposed yet
      document_title: response.node_name,
      document_body_text: response.content || '',
      document_word_count: response.word_count
    };
}

export interface UpdateDocumentContentDto {
    user_id?: string;
    novel_id: string;
    document_id: string;
    content: string;
}

export async function updateDocumentContent(data: UpdateDocumentContentDto): Promise<string> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel) {
             let chap: Chapter | undefined = undefined;
             // Check volumes
            if (novel.volumes) {
                for (const vol of novel.volumes) {
                    chap = vol.chapters.find(c => c.id === data.document_id);
                    if (chap) break;
                }
            }
            if (!chap && novel.orphanChapters) {
                chap = novel.orphanChapters.find(c => c.id === data.document_id);
            }
            
            if (chap) {
                // Update content
                const currentVersion = chap.versions.find((v) => v.id === chap!.currentVersionId);
                if (currentVersion) {
                    currentVersion.content = data.content;
                    currentVersion.updatedAt = new Date().toISOString();
                } else {
                     chap.versions.push({
                         id: 'v1',
                         versionNumber: 1,
                         content: data.content,
                         updatedAt: new Date().toISOString()
                     });
                     chap.currentVersionId = 'v1';
                }
                saveMockData();
                return "success";
            }
        }
        throw new Error('Document not found');
    }
    
    await request.patch<NodeDetailResponse>(`/nodes/${data.document_id}`, {
      content: data.content
    });
    return "success";
}
