import { AppwriteException, ID, Query } from 'appwrite';
import type { Models } from 'appwrite';
import { STORAGE_BUCKET_ID, storage } from '../config/appwrite';

/**
 * Everything lives in one bucket. Blog images go in this virtual folder so the media library lists
 * (and can delete or replace) only them, never resumes, the profile photo or project logos at the root.
 */
const BLOG_IMAGE_FOLDER = 'blog';

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

/** URL of a stored file as-is: resumes and other downloads, and blog images. */
export const getFileUrl = (fileId: string) => storage.getFileView({ bucketId: STORAGE_BUCKET_ID, fileId });

/**
 * Optionally resized preview of an *image*. Appwrite's preview endpoint only renders images --
 * point documents at `getFileUrl` instead, or it serves a placeholder.
 */
export const getFilePreviewUrl = (fileId: string, width?: number, height?: number) =>
    storage.getFilePreview({ bucketId: STORAGE_BUCKET_ID, fileId, width, height });

export const uploadFile = async (
    file: File,
    { allowedTypes = ALLOWED_IMAGE_TYPES, folder }: { allowedTypes?: string[]; folder?: string } = {}
) => {
    try {
        assertAllowedType(file, allowedTypes);
        return await storage.createFile({ bucketId: STORAGE_BUCKET_ID, fileId: ID.unique(), file, folder });
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

/** Deletes a file. A file that's already gone counts as deleted, so stale ids never block a save. */
export const deleteFile = async (fileId: string) => {
    try {
        await storage.deleteFile({ bucketId: STORAGE_BUCKET_ID, fileId });
        return true;
    } catch (error) {
        if (error instanceof AppwriteException && error.code === 404) {
            return true;
        }

        console.error('Error deleting file:', error);
        throw error;
    }
};

export const getContentImages = async (limit = 50): Promise<Models.File[]> => {
    try {
        const images = await storage.listFiles({
            bucketId: STORAGE_BUCKET_ID,
            queries: [Query.equal('folder', BLOG_IMAGE_FOLDER), Query.limit(limit), Query.orderDesc('$createdAt')],
        });

        return images.files;
    } catch (error) {
        console.error('Error getting content images:', error);
        return [];
    }
};

export const uploadContentImage = async (file: File): Promise<{ fileId: string; url: string }> => {
    const result = await uploadFile(file, { folder: BLOG_IMAGE_FOLDER });

    return { fileId: result.$id, url: getFileUrl(result.$id) };
};

/** Replaces an image in place by reusing its file id, so existing markdown links keep working. */
export const updateContentImage = async (fileId: string, file: File): Promise<Models.File> => {
    try {
        assertAllowedType(file, ALLOWED_IMAGE_TYPES);
        await deleteFile(fileId);
        return await storage.createFile({ bucketId: STORAGE_BUCKET_ID, fileId, file, folder: BLOG_IMAGE_FOLDER });
    } catch (error) {
        console.error('Error updating content image:', error);
        throw error;
    }
};
