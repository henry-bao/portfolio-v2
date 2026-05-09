import { ID, Models, Query } from 'appwrite';
import { STORAGE_BLOGS_BUCKET_ID, STORAGE_FILE_BUCKET_ID, storage } from '../config/appwrite';

export { STORAGE_BLOGS_BUCKET_ID, STORAGE_FILE_BUCKET_ID, storage };

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const validateFileType = (file: File, allowedTypes: string[]): boolean => allowedTypes.includes(file.type);

export const uploadFile = async (file: File, options?: { allowedTypes?: string[] }) => {
    try {
        const allowedTypes = options?.allowedTypes || ALLOWED_IMAGE_TYPES;

        if (!validateFileType(file, allowedTypes)) {
            throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        }

        return await storage.createFile(STORAGE_FILE_BUCKET_ID, ID.unique(), file);
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const getFilePreview = (fileId: string) => storage.getFilePreview(STORAGE_FILE_BUCKET_ID, fileId);

export const deleteFile = async (fileId: string, bucketId = STORAGE_FILE_BUCKET_ID) => {
    try {
        await storage.deleteFile(bucketId, fileId);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

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

export const updateContentImage = async (fileId: string, file: File): Promise<Models.File> => {
    try {
        if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
            throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }

        await storage.deleteFile(STORAGE_BLOGS_BUCKET_ID, fileId);
        return await storage.createFile(STORAGE_BLOGS_BUCKET_ID, fileId, file);
    } catch (error) {
        console.error('Error updating content image:', error);
        throw error;
    }
};

export const uploadContentImage = async (file: File): Promise<{ fileId: string; url: string }> => {
    try {
        if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
            throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }

        const result = await storage.createFile(STORAGE_BLOGS_BUCKET_ID, ID.unique(), file);

        return {
            fileId: result.$id,
            url: storage.getFileView(STORAGE_BLOGS_BUCKET_ID, result.$id),
        };
    } catch (error) {
        console.error('Error uploading content image:', error);
        throw error;
    }
};

export const getContentImagePreviewUrl = (fileId: string): string => storage.getFileView(STORAGE_BLOGS_BUCKET_ID, fileId);
