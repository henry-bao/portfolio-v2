import { ApiError, withApiErrors } from './core/errors';
import { FOLDERS, deleteFile, fileUrl, getFile, listFolder, uploadFile, validateFile } from './core/files';
import type { StoredFile } from './core/files';
import type { BlogPost } from './blog';

/**
 * The blog media library: images inserted into post bodies, kept in the bucket's `blog` folder.
 * Every operation here refuses to touch files outside that folder.
 */

export const listBlogImages = () => listFolder(FOLDERS.blog);

export const uploadBlogImage = (file: File) => uploadFile(file, { kind: 'image', folder: FOLDERS.blog });

const requireBlogImage = async (fileId: string): Promise<StoredFile> => {
    const file = await getFile(fileId);

    if (!file) {
        throw new ApiError('not_found', 'That image no longer exists.');
    }

    if (file.folder !== FOLDERS.blog) {
        throw new ApiError('forbidden', 'Only images in the blog media library can be changed here.');
    }

    return file;
};

/**
 * Replaces an image's contents while keeping its file id, so every post that embeds its URL shows the
 * new image. Appwrite can't overwrite a file, so the old one is deleted and the new one uploaded under
 * the same id. The old bytes are downloaded first and put back if the new upload fails, so a failed
 * replace never leaves posts with a broken image.
 *
 * Browsers may keep showing the old image from cache for a while after a replace.
 */
export const replaceBlogImage = (fileId: string, file: File) =>
    withApiErrors('Replace image', async () => {
        const invalid = validateFile(file, 'image');

        if (invalid) {
            throw invalid;
        }

        const existing = await requireBlogImage(fileId);
        const url = fileUrl(fileId);
        const backupResponse = url ? await fetch(url) : null;

        if (!backupResponse?.ok) {
            throw new ApiError('unknown', "Couldn't back up the current image, so it was left unchanged.");
        }

        const backup = new File([await backupResponse.blob()], existing.name, { type: existing.mimeType });

        await deleteFile(fileId);

        try {
            return await uploadFile(file, { kind: 'image', folder: FOLDERS.blog, fileId });
        } catch (error) {
            try {
                await uploadFile(backup, { kind: 'image', folder: FOLDERS.blog, fileId });
            } catch (restoreError) {
                console.error(`Couldn't restore image ${fileId} after a failed replace:`, restoreError);
            }
            throw error;
        }
    });

export async function deleteBlogImage(fileId: string) {
    await requireBlogImage(fileId);
    await deleteFile(fileId);
}

/** Posts whose body or cover references `fileId`, so the UI can warn before deleting it. */
export const findPostsUsingFile = (fileId: string, posts: BlogPost[]) =>
    posts.filter((post) => post.coverImageId === fileId || post.content.includes(fileId));
