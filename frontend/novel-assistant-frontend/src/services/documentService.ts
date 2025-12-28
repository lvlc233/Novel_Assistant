
import { config } from '@/config';
import { DirectoryNodeDto,ApiResponse} from '@/services/models';

const DOCUMENT_API_BASE_URL = config.novel.documentApiBaseUrl;

// --- Folder & Document Operations ---

export interface CreateFolderDto {
  user_id: string;
  novel_id: string;
  name: string;
}

export async function createFolder(data: CreateFolderDto): Promise<DirectoryNodeDto> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/create_folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<DirectoryNodeDto> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Create folder failed');
    return result.data;
}

export interface DeleteFolderDto {
  user_id: string;
  novel_id: string;
  folder_id: string;
}

export async function deleteFolder(data: DeleteFolderDto): Promise<boolean> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/delete_folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<boolean> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Delete folder failed');
    return result.data;
}

export interface RenameFolderDto {
    user_id: string;
    novel_id: string;
    folder_id: string;
    name: string;
}

export async function renameFolder(data: RenameFolderDto): Promise<string> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/rename_folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<string> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Rename folder failed');
    return result.data;
}

export interface CreateDocumentDto {
    user_id: string;
    novel_id: string;
    title: string;
    folder_id?: string | null;
}

export async function createDocument(data: CreateDocumentDto): Promise<DirectoryNodeDto> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/create_document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<DirectoryNodeDto> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Create document failed');
    return result.data;
}

export interface DeleteDocumentDto {
    user_id: string;
    novel_id: string;
    document_id: string;
}

export async function deleteDocument(data: DeleteDocumentDto): Promise<boolean> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/delete_document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<boolean> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Delete document failed');
    return result.data;
}

export interface RenameDocumentDto {
    user_id: string;
    novel_id: string;
    document_id: string;
    title: string;
}

export async function renameDocument(data: RenameDocumentDto): Promise<string> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/rename_document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<string> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Rename document failed');
    return result.data;
}

export interface GetDocumentDetailDto {
    user_id: string;
    document_id: string;
    version_id?: string;
}

// Adjust return type based on backend response
export async function getDocumentDetail(data: GetDocumentDetailDto): Promise<any> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/get_document_detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<any> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Get document detail failed');
    return result.data;
}

export interface UpdateDocumentContentDto {
    user_id: string;
    novel_id: string;
    document_id: string;
    content: string;
}

export async function updateDocumentContent(data: UpdateDocumentContentDto): Promise<string> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/update_document_content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result: ApiResponse<string> = await response.json();
    if (result.code !== '200') throw new Error(result.message || 'Update document content failed');
    return result.data;
}
