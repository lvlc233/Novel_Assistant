import { request } from '@/lib/request';
import { NodeDTO, DocumentResponse, DocumentDetailResponse, NodeResponse, CreateNodeRequest, DocumentCreateRequest } from '@/services/models';
import { mockNovels, USE_MOCK, saveMockData } from '@/services/mockData';
import { Chapter } from '@/types/novel';

/**
 * Service for managing documents and folders (nodes).
 * Aligned with backend /nodes endpoints.
 */

// Frontend DTOs (keeping existing interfaces where possible for compatibility)

export interface CreateFolderDto {
  user_id?: string; // Ignored by backend
  novel_id: string;
  name: string;
}

export async function createFolder(data: CreateFolderDto): Promise<NodeDTO> {
    if (USE_MOCK) {
        // Mock implementation omitted for brevity, assuming existing mock logic is fine or irrelevant if USE_MOCK=false
        // For simplicity, just error or minimal mock if needed.
        // Keeping original mock logic is safer if user switches back.
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
    
    // Backend: POST /works/{work_id}/nodes
    const response = await request.post<NodeResponse>(`/works/${data.novel_id}/nodes`, {
      node_name: data.name,
      node_type: 'folder',
      fater_node_id: null // Explicitly null for root folders
    });
    
    return {
      node_id: response.node_id,
      node_name: response.node_name,
      node_type: response.node_type,
      sort_order: 0,
      parent_id: response.fater_node_id || null
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
    // Backend: DELETE /works/{work_id}/nodes/{node_id}
    await request.delete(`/works/${data.novel_id}/nodes/${data.folder_id}`);
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
    // Backend: PATCH /works/{work_id}/nodes/{node_id}
    await request.patch(`/works/${data.novel_id}/nodes/${data.folder_id}`, {
      node_name: data.name
    });
    return data.name;
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
    
    // Backend: POST /works/{work_id}/documents
    const response = await request.post<DocumentResponse>(`/works/${data.novel_id}/documents`, {
      title: data.title,
      fater_node_id: data.folder_id
    });

    return {
      node_id: response.document_id,
      node_name: response.title,
      node_type: 'document',
      sort_order: 0,
      parent_id: response.fater_node_id || null
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
    // Backend: DELETE /works/{work_id}/documents/{document_id}
    await request.delete(`/works/${data.novel_id}/documents/${data.document_id}`);
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
    // Backend: PATCH /works/{work_id}/documents/{document_id}
    // Note: Rename uses update_document endpoint but only sending title
    await request.patch(`/works/${data.novel_id}/documents/${data.document_id}`, {
      title: data.title
    });
    return data.title;
}

export interface GetDocumentDetailDto {
    user_id?: string;
    novel_id: string; // Added novel_id (work_id)
    document_id: string;
    version_id?: string;
}

export interface DocumentDetailDto {
    document_id: string;
    document_version_id: string;
    document_title: string;
    document_body_text: string | null;
    document_word_count: number;
}

export async function getDocumentDetail(data: GetDocumentDetailDto): Promise<DocumentDetailDto> {
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
    
    // Backend: GET /works/{work_id}/documents/{document_id}
    const response = await request.get<DocumentDetailResponse>(`/works/${data.novel_id}/documents/${data.document_id}`);
    return {
      document_id: data.document_id,
      document_version_id: 'latest', 
      document_title: response.title,
      document_body_text: response.full_text || '',
      document_word_count: (response.full_text || '').length
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
    
    // Backend: PATCH /works/{work_id}/documents/{document_id}
    const payload: DocumentUpdateRequest = {
        full_text: data.content
    };
    await request.patch(`/works/${data.novel_id}/documents/${data.document_id}`, payload);
    return "success";
}
