import { ID, Query } from 'appwrite';
import { z } from 'zod';
import { getBackend, getBackendOrNull } from './client';
import { ApiError, toApiError, withApiErrors } from './errors';

/**
 * Everything lives in the project's single bucket (the plan allows only one). Each kind of file gets
 * its own virtual folder, so anything that lists or deletes in bulk (the blog media library) can be
 * scoped to its folder and never touch resumes, logos or the profile photo.
 *
 * Files uploaded before folders existed sit at the bucket root; they keep working as before.
 */
export const FOLDERS = {
    /** Images inserted into post bodies; this is what the media library lists. */
    blog: 'blog',
    /** Post cover images, kept apart so the media library can never list or delete them. */
    blogCovers: 'blog-covers',
    profile: 'profile',
    projects: 'projects',
    resumes: 'resumes',
} as const;

export type Folder = (typeof FOLDERS)[keyof typeof FOLDERS];

const MB = 1024 * 1024;

export const FILE_RULES = {
    image: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        maxBytes: 10 * MB,
        description: 'JPG, PNG, GIF, WebP or SVG, up to 10 MB',
    },
    pdf: {
        mimeTypes: ['application/pdf'],
        extensions: ['pdf'],
        maxBytes: 20 * MB,
        description: 'PDF, up to 20 MB',
    },
} as const;

export type FileKind = keyof typeof FILE_RULES;

/** Value for an `<input type="file" accept>` attribute. */
export const acceptAttribute = (kind: FileKind) =>
    [...FILE_RULES[kind].mimeTypes, ...FILE_RULES[kind].extensions.map((extension) => `.${extension}`)].join(',');

const extensionOf = (fileName: string) => fileName.split('.').pop()?.toLowerCase() ?? '';

/**
 * Checks a picked file before any upload. Some browsers report an empty `type` for valid files,
 * so the extension is accepted as a fallback.
 */
export function validateFile(file: File, kind: FileKind): ApiError | null {
    const rules = FILE_RULES[kind];
    const typeAllowed =
        (rules.mimeTypes as readonly string[]).includes(file.type) ||
        (!file.type && (rules.extensions as readonly string[]).includes(extensionOf(file.name)));

    if (!typeAllowed) {
        return new ApiError('invalid_input', `"${file.name}" isn't a supported file. Use ${rules.description}.`);
    }

    if (file.size === 0) {
        return new ApiError('invalid_input', `"${file.name}" is empty.`);
    }

    if (file.size > rules.maxBytes) {
        return new ApiError('invalid_input', `"${file.name}" is too large. Use ${rules.description}.`);
    }

    return null;
}

const storedFileSchema = z.object({
    $id: z.string(),
    $createdAt: z.string(),
    $updatedAt: z.string(),
    name: z.string(),
    mimeType: z.string(),
    sizeOriginal: z.number(),
    /** Stored with a trailing slash ("blog/"), empty at the bucket root. */
    folder: z.string().nullish().transform((folder) => folder?.replace(/\/+$/, '') ?? ''),
});

export type StoredFile = z.infer<typeof storedFileSchema>;

/**
 * Public URL of a stored file, or `null` when there's no id.
 *
 * Always the plain `view` URL: image transformations (`getFilePreview`) are blocked on the project's
 * Appwrite plan and return 403 for every file, so images are sized with CSS instead.
 *
 * Built by hand rather than with `storage.getFileView`, because these URLs get pasted into post
 * bodies and stored forever: the SDK appends extra parameters (e.g. an empty `impersonateuserid`)
 * that can change between SDK versions. api/resume.ts builds the same format.
 */
export function fileUrl(fileId: string | null | undefined): string | null {
    const backend = getBackendOrNull();

    if (!fileId || !backend) {
        return null;
    }

    const { endpoint, bucketId, projectId } = backend.config;
    const url = new URL(`${endpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(fileId)}/view`);
    url.searchParams.set('project', projectId);
    return url.toString();
}

export const uploadFile = (file: File, { kind, folder, fileId = ID.unique() }: { kind: FileKind; folder: Folder; fileId?: string }) =>
    withApiErrors(`Upload ${file.name}`, async () => {
        const invalid = validateFile(file, kind);

        if (invalid) {
            throw invalid;
        }

        const { storage, config } = getBackend();
        return storedFileSchema.parse(await storage.createFile({ bucketId: config.bucketId, fileId, file, folder }));
    });

/** `null` when the file doesn't exist. */
export const getFile = (fileId: string) =>
    withApiErrors(`Get file ${fileId}`, async () => {
        const { storage, config } = getBackend();

        try {
            return storedFileSchema.parse(await storage.getFile({ bucketId: config.bucketId, fileId }));
        } catch (error) {
            if (toApiError(error).kind === 'not_found') {
                return null;
            }
            throw error;
        }
    });

/** Deleting a file that's already gone counts as success, so stale ids never block a save. */
export const deleteFile = (fileId: string) =>
    withApiErrors(`Delete file ${fileId}`, async () => {
        const { storage, config } = getBackend();

        try {
            await storage.deleteFile({ bucketId: config.bucketId, fileId });
        } catch (error) {
            if (toApiError(error).kind !== 'not_found') {
                throw error;
            }
        }
    });

/**
 * For cleanup after the main operation already succeeded: a failure here only leaves an unused file
 * behind, so it is logged rather than reported as a failed save.
 */
export async function deleteFileQuietly(fileId: string | null | undefined) {
    if (!fileId) {
        return;
    }

    try {
        await deleteFile(fileId);
    } catch (error) {
        console.error(`Couldn't delete unused file ${fileId}:`, error);
    }
}

/** Every file in `folder`, newest first. */
export const listFolder = (folder: Folder) =>
    withApiErrors(`List ${folder} files`, async () => {
        const { storage, config } = getBackend();
        const files: StoredFile[] = [];
        const pageSize = 100;
        const maxPages = 100;

        for (let page = 0; page < maxPages; page += 1) {
            const { files: batch } = await storage.listFiles({
                bucketId: config.bucketId,
                // Match both spellings: Appwrite reports folders with a trailing slash.
                queries: [
                    Query.equal('folder', [folder, `${folder}/`]),
                    Query.orderDesc('$createdAt'),
                    Query.limit(pageSize),
                    Query.offset(page * pageSize),
                ],
            });

            files.push(...batch.map((file) => storedFileSchema.parse(file)));

            if (batch.length < pageSize) {
                break;
            }
        }

        return files;
    });

/** What an editor wants to do with the file a row points at. */
export type FileChange = { type: 'keep' } | { type: 'remove' } | { type: 'replace'; file: File };

export const KEEP_FILE: FileChange = { type: 'keep' };

/**
 * Changes the file a row references without ever leaving the row pointing at a missing file:
 *
 * 1. upload the replacement (if any),
 * 2. `commit` the row with the new id (or `null`),
 * 3. only then delete the old file.
 *
 * If step 2 fails, the fresh upload is deleted again so nothing is orphaned, and the row still points
 * at the old, untouched file.
 */
export async function swapFile<T>({
    currentFileId,
    change,
    kind,
    folder,
    commit,
}: {
    currentFileId: string | null;
    change: FileChange;
    kind: FileKind;
    folder: Folder;
    commit: (nextFileId: string | null) => Promise<T>;
}): Promise<T> {
    if (change.type === 'keep') {
        return commit(currentFileId);
    }

    const uploaded = change.type === 'replace' ? await uploadFile(change.file, { kind, folder }) : null;
    let result: T;

    try {
        result = await commit(uploaded?.$id ?? null);
    } catch (error) {
        await deleteFileQuietly(uploaded?.$id);
        throw error;
    }

    if (currentFileId && currentFileId !== uploaded?.$id) {
        await deleteFileQuietly(currentFileId);
    }

    return result;
}
