import { request } from '@/lib/request';
import { NodeDTO, DocumentResponse, DocumentDetailResponse, NodeResponse, NodeCreateRequest, DocumentCreateRequest, DocumentUploadRequest, DocumentVersionUploadRequest, NodeUpdateRequest, DocumentVersionResponse, DocumentVersionCreateRequest, DocumentVersionItem } from '@/services/models';
import { Chapter, Volume } from '@/types/work';

/**
 * Service for managing documents and folders (nodes).
 * Aligned with backend /work endpoints.
 */

// Frontend DTOs (keeping existing interfaces where possible for compatibility)

export interface CreateFolderDto {
  user_id?: string; // Ignored by backend
  work_id: string;
  name: string;
}

export async function createFolder(data: CreateFolderDto): Promise<NodeDTO> {    
    // Backend: POST /work/{work_id}/node
    const payload: NodeCreateRequest = {
        name: data.name,
        type: 'folder',
        from_node_id: null // Explicitly null for root folders
    };
    
    const response = await request.post<NodeResponse>(`/work/${data.work_id}/node`, payload);
    
    return {
      id: response.id,
      name: response.name,
      type: response.type, // should be 'folder'
      from_node_id: response.from_node_id || null
    };
}

export interface DeleteFolderDto {
  user_id?: string;
  work_id: string;
  folder_id: string;
}

export async function deleteFolder(data: DeleteFolderDto): Promise<boolean> {
    await request.delete(`/work/${data.work_id}/node/${data.folder_id}`);
    return true;
}

export interface RenameFolderDto {
    user_id?: string;
    work_id: string;
    folder_id: string;
    name: string;
}

export async function renameFolder(data: RenameFolderDto): Promise<string> {
    const payload: NodeUpdateRequest = {
        name: data.name
    };
    await request.patch(`/work/${data.work_id}/node/${data.folder_id}`, payload);
    return data.name;
}

export interface CreateDocumentDto {
    user_id?: string;
    work_id: string;
    title: string;
    folder_id?: string | null;
}

export async function createDocument(data: CreateDocumentDto): Promise<NodeDTO> {    
    // Backend: POST /work/{work_id}/document
    const payload: DocumentCreateRequest = {
        title: data.title,
        from_node_id: data.folder_id
    };
    
    const response = await request.post<DocumentResponse>(`/work/${data.work_id}/document`, payload);

    return {
      id: response.id,
      name: response.title,
      type: 'document',
      from_node_id: response.from_node_id || null,
      now_version: response.now_version,
      current_version_id: response.current_version_id
    };
}

export interface DeleteDocumentDto {
    user_id?: string;
    work_id: string;
    document_id: string;
}

export async function deleteDocument(data: DeleteDocumentDto): Promise<boolean> {
    // Backend: DELETE /work/{work_id}/document/{document_id}
    await request.delete(`/work/${data.work_id}/document/${data.document_id}`);
    return true;
}

export interface RenameDocumentDto {
    user_id?: string;
    work_id: string;
    document_id: string;
    title: string;
}

export async function renameDocument(data: RenameDocumentDto): Promise<string> {

    const payload: DocumentUploadRequest = {
        title: data.title
    };
    await request.patch(`/work/${data.work_id}/document/${data.document_id}`, payload);
    return data.title;
}

export interface GetDocumentDetailDto {
    user_id?: string;
    work_id?: string; // Added work_id, optional if fetching by document_id only
    document_id: string;
    version_id?: string;
}

export interface DocumentDetailDto {
    document_id: string;
    document_version_id: string;
    document_title: string;
    document_body_text: string | null;
    document_word_count: number;
    work_id?: string; // Add work_id to return
    current_version_name?: string | null;
}

export async function getDocumentDetail(data: GetDocumentDetailDto): Promise<DocumentDetailDto> {    
    // Backend: GET /work/{work_id}/document/{document_id} or .../version/{version_id}
    let response: DocumentDetailResponse;
    if (data.work_id) {
        if (data.version_id) {
             const encodedVersion = encodeURIComponent(data.version_id);
             console.log(`[documentService] Fetching version: ${data.version_id} (encoded: ${encodedVersion})`);
             response = await request.get<DocumentDetailResponse>(`/work/${data.work_id}/document/${data.document_id}/version/${encodedVersion}`);
        } else {
             response = await request.get<DocumentDetailResponse>(`/work/${data.work_id}/document/${data.document_id}`);
        }
    } else {
        // Strict Mode: work_id is required per architecture
        throw new Error('work_id is required to fetch document detail');
    }

    return {
      document_id: response.id || data.document_id,
      document_version_id: response.now_version || 'latest', 
      document_title: response.title,
      document_body_text: response.full_text || '',
      document_word_count: (response.full_text || '').length,
      work_id: response.work_id || data.work_id,
      current_version_name: response.now_version
    };
}

export async function getDocumentVersions(work_id: string, document_id: string): Promise<DocumentVersionItem[]> {
    const res = await request.get<DocumentVersionResponse>(`/work/${work_id}/document/${document_id}/version`);
    return res.versions;
}

export interface CreateDocumentVersionDto {
    user_id?: string;
    work_id: string;
    document_id: string;
    version_name?: string;
}

export async function createDocumentVersion(data: CreateDocumentVersionDto): Promise<void> {
    const payload: DocumentVersionCreateRequest = { version_name: data.version_name };
    await request.post(`/work/${data.work_id}/document/${data.document_id}/version`, payload);
}

export async function deleteDocumentVersion(work_id: string, document_id: string, version_id: string): Promise<void> {
    await request.delete(`/work/${work_id}/document/${document_id}/version/${version_id}`);
}

export interface UpdateDocumentContentDto {
    user_id?: string;
    work_id: string;
    document_id: string;
    version_id: string;
    content: string;
}

export async function updateDocumentContent(data: UpdateDocumentContentDto): Promise<DocumentDetailResponse> {
    // Backend: PATCH /work/{work_id}/document/{document_id}/version/{version_id}
    const payload: DocumentVersionUploadRequest = {
        full_text: data.content
    };
    return await request.patch<DocumentDetailResponse>(`/work/${data.work_id}/document/${data.document_id}/version/${data.version_id}`, payload);
}
