import { storage, STORAGE_FILE_BUCKET_ID } from './appwrite';
import { logger } from '../utils/logger';

/**
 * Proxy function to get file URL from Appwrite
 * This is used to avoid exposing Appwrite credentials in the frontend
 *
 * @param fileId The ID of the file to get
 * @returns The URL of the file
 */
export const getFileUrl = (fileId: string): string => {
    try {
        const fileUrl = storage.getFileView(STORAGE_FILE_BUCKET_ID, fileId);
        return fileUrl.toString();
    } catch (error) {
        logger.error('Error getting file URL:', error);
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
    try {
        const previewUrl = storage.getFilePreview(STORAGE_FILE_BUCKET_ID, fileId, width, height);
        return previewUrl.toString();
    } catch (error) {
        logger.error('Error getting file preview URL:', error);
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
    try {
        const downloadUrl = storage.getFileDownload(STORAGE_FILE_BUCKET_ID, fileId);
        return downloadUrl.toString();
    } catch (error) {
        logger.error('Error getting file download URL:', error);
        return '';
    }
};
