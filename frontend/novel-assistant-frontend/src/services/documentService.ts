import { DirectoryNodeDto } from '@/services/models';
import { request } from '@/lib/request';
import { Chapter } from '@/types/novel';
import { mockNovels, USE_MOCK, saveMockData } from '@/services/mockData';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260121-01
 * 创建时间: 2026-01-20 21:48
 * 更新时间: 2026-01-21 11:40
 * 更新记录:
 * - [2026-01-21 11:40:FE-REF-20260121-01: 在何处使用: 编辑器/目录相关接口；如何使用: createFolder/createDocument 等；实现概述: 引入 mockData 并在 USE_MOCK=true 时返回模拟数据。]
 * - [2026-01-20 21:48:FE-REF-20260120-02: 在何处使用: 编辑器/目录相关接口；如何使用: 调用 createFolder/createDocument/getDocumentDetail 等；实现概述: 补齐 getDocumentDetail 返回类型，移除 any。]
 */

// --- Folder & Document Operations ---

export interface CreateFolderDto {
  user_id: string;
  novel_id: string;
  name: string;
}

export async function createFolder(data: CreateFolderDto): Promise<DirectoryNodeDto> {
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
            // Ensure no duplicate ID (extremely unlikely with UUID but good practice)
            if (!novel.volumes.find(v => v.id === newVolume.id)) {
                novel.volumes.push(newVolume);
            }
            saveMockData();
            return {
                node_id: newVolume.id,
                node_name: newVolume.title,
                node_type: 'folder',
                sort_order: newVolume.order,
                children: []
            };
        }
        throw new Error('Novel not found');
    }
    return request.post<DirectoryNodeDto>('/create_folder', data);
}

export interface DeleteFolderDto {
  user_id: string;
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
    return request.post<boolean>('/delete_folder', data);
}

export interface RenameFolderDto {
    user_id: string;
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
    return request.post<string>('/rename_folder', data);
}

export interface CreateDocumentDto {
    user_id: string;
    novel_id: string;
    title: string;
    folder_id?: string | null;
}

export async function createDocument(data: CreateDocumentDto): Promise<DirectoryNodeDto> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const novel = mockNovels.find(n => n.id === data.novel_id);
        if (novel) {
            const newChapter = {
                id: `mock-chap-${crypto.randomUUID()}`,
                title: data.title,
                order: 1, // Simplified order
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
                children: []
            };
        }
        throw new Error('Novel not found');
    }
    return request.post<DirectoryNodeDto>('/create_document', data);
}

export interface DeleteDocumentDto {
    user_id: string;
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
    return request.post<boolean>('/delete_document', data);
}

export interface RenameDocumentDto {
    user_id: string;
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
    return request.post<string>('/rename_document', data);
}

export interface GetDocumentDetailDto {
    user_id: string;
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
    return request.post<DocumentDetailResponse>('/get_document_detail', data);
}

export interface UpdateDocumentContentDto {
    user_id: string;
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
    return request.post<string>('/update_document_content', data);
}
