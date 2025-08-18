import { storage, STORAGE_FILE_BUCKET_ID } from './appwrite';

/**
 * Proxy function to get file URL from Appwrite
 * This is used to avoid exposing Appwrite credentials in the frontend
 *
 * @param fileId The ID of the file to get
 * @returns The URL of the file
 */
export const getFileUrl = (fileId: string): string => {
    if (!fileId) {
        console.warn('getFileUrl: No fileId provided');
        return '';
    }
    
    try {
        const fileUrl = storage.getFileView(STORAGE_FILE_BUCKET_ID, fileId);
        return fileUrl.toString();
    } catch (error) {
        console.error('Error getting file URL:', error);
        // Return a placeholder or fallback URL instead of empty string
        // This prevents broken links in the UI
        return '';
    }
};

/**
 * Proxy function to get file preview URL from Appwrite
 *
 * @param fileId The ID of the file to get preview for
 * @param width Optional width of the preview
 * @param height Optional height of the preview
 * @returns The URL of the file preview
 */
export const getFilePreviewUrl = (fileId: string, width?: number, height?: number): string => {
    if (!fileId) {
        console.warn('getFilePreviewUrl: No fileId provided');
        return '';
    }
    
    try {
        const previewUrl = storage.getFilePreview(STORAGE_FILE_BUCKET_ID, fileId, width, height);
        return previewUrl.toString();
    } catch (error) {
        console.error('Error getting file preview URL:', error);
        // Return empty string for preview URLs as they're typically optional
        return '';
    }
};

/**
 * Proxy function to get file download URL from Appwrite
 *
 * @param fileId The ID of the file to download
 * @returns The URL to download the file
 */
export const getFileDownloadUrl = (fileId: string): string => {
    if (!fileId) {
        console.warn('getFileDownloadUrl: No fileId provided');
        return '';
    }
    
    try {
        const downloadUrl = storage.getFileDownload(STORAGE_FILE_BUCKET_ID, fileId);
        return downloadUrl.toString();
    } catch (error) {
        console.error('Error getting file download URL:', error);
        return '';
    }
};
