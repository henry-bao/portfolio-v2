import { ID, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { STORAGE_BLOGS_BUCKET_ID, STORAGE_FILE_BUCKET_ID, storage } from '../config/appwrite';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const assertAllowedType = (file: File, allowedTypes: string[]) => {
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
};

/** URL of a file in the main bucket, used for resumes and other downloads. */
export const getFileUrl = (fileId: string) => storage.getFileView(STORAGE_FILE_BUCKET_ID, fileId);

/** Optionally resized preview of a file in the main bucket. */
export const getFilePreviewUrl = (fileId: string, width?: number, height?: number) =>
    storage.getFilePreview(STORAGE_FILE_BUCKET_ID, fileId, width, height);

/** URL of an image in the blog bucket. */
export const getContentImagePreviewUrl = (fileId: string) => storage.getFileView(STORAGE_BLOGS_BUCKET_ID, fileId);

export const uploadFile = async (file: File, { allowedTypes = ALLOWED_IMAGE_TYPES } = {}) => {
    try {
        assertAllowedType(file, allowedTypes);
        return await storage.createFile(STORAGE_FILE_BUCKET_ID, ID.unique(), file);
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const deleteFile = async (fileId: string, bucketId = STORAGE_FILE_BUCKET_ID) => {
    try {
        await storage.deleteFile(bucketId, fileId);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

export const deleteContentImage = (fileId: string) => deleteFile(fileId, STORAGE_BLOGS_BUCKET_ID);

export const getContentImages = async (limit = 50): Promise<Models.File[]> => {
    try {
        const images = await storage.listFiles(STORAGE_BLOGS_BUCKET_ID, [
            Query.limit(limit),
            Query.orderDesc('$createdAt'),
        ]);

        return images.files;
    } catch (error) {
        console.error('Error getting content images:', error);
        return [];
    }
};

export const uploadContentImage = async (file: File): Promise<{ fileId: string; url: string }> => {
    try {
        assertAllowedType(file, ALLOWED_IMAGE_TYPES);
        const result = await storage.createFile(STORAGE_BLOGS_BUCKET_ID, ID.unique(), file);

        return { fileId: result.$id, url: getContentImagePreviewUrl(result.$id) };
    } catch (error) {
        console.error('Error uploading content image:', error);
        throw error;
    }
};

/** Replaces an image in place by reusing its file id, so existing markdown links keep working. */
export const updateContentImage = async (fileId: string, file: File): Promise<Models.File> => {
    try {
        assertAllowedType(file, ALLOWED_IMAGE_TYPES);
        await storage.deleteFile(STORAGE_BLOGS_BUCKET_ID, fileId);
        return await storage.createFile(STORAGE_BLOGS_BUCKET_ID, fileId, file);
    } catch (error) {
        console.error('Error updating content image:', error);
        throw error;
    }
};
