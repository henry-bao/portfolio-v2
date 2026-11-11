import { Query } from 'appwrite';
import { z } from 'zod';
import { getBackend } from './core/client';
import { ApiError, toApiError, withApiErrors } from './core/errors';
import { input, parseInput, read } from './core/fields';
import { FOLDERS, deleteFileQuietly, swapFile } from './core/files';
import type { FileChange } from './core/files';
import { publicReadWhen } from './core/permissions';
import { defineTable } from './core/table';
import type { TableRow } from './core/table';

/**
 * Blog posts. Only published posts are publicly readable (once row security is on for this table):
 * every write recomputes the row's permissions from `published`.
 */
const blogPostsTable = defineTable(
    'blog post',
    'blogPosts',
    {
        title: read.string(),
        content: read.string(),
        summary: read.string(),
        slug: z.string().min(1),
        published: read.flag(false),
        publishedDate: z.string(),
        coverImageId: read.text(),
        tags: read.textList(),
        viewCount: read.count(),
    }
);

export type BlogPost = TableRow<typeof blogPostsTable>;

/** `/blogs/preview` renders local drafts, so no post may use that slug. */
export const RESERVED_SLUGS = ['preview'];
const SLUG_MAX_LENGTH = 120;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Héllo, World!" → "hello-world". Returns `''` when nothing usable is left. */
export const slugify = (text: string) =>
    text
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, SLUG_MAX_LENGTH)
        .replace(/^-+|-+$/g, '');

export const blogPostInputSchema = z.object({
    title: input.requiredText('Title', 999),
    slug: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Slug is required')
        .max(SLUG_MAX_LENGTH, `Slug must be at most ${SLUG_MAX_LENGTH} characters`)
        .regex(SLUG_PATTERN, 'Slug can only contain lowercase letters, numbers and single dashes')
        .refine((slug) => !RESERVED_SLUGS.includes(slug), 'That slug is reserved. Pick another one.'),
    summary: input.requiredText('Summary', 99_999),
    content: input.requiredText('Content', 99_999),
    publishedDate: input.isoDate('Published date'),
    published: z.boolean(),
    tags: input.textList('Tag', 99, 20),
});

export type BlogPostInput = z.input<typeof blogPostInputSchema>;

const newestFirst = Query.orderDesc('publishedDate');

/** Published posts, newest first. Pass `limit` for a preview (the home page shows three). */
export const listPublishedPosts = (limit?: number) => {
    const queries = [Query.equal('published', true), newestFirst];
    return limit === undefined ? blogPostsTable.listAll(queries) : blogPostsTable.list(queries, { limit });
};

/** Every post, drafts included. Admin only. */
export const listAllPosts = () => blogPostsTable.listAll([newestFirst]);

export const getPost = (postId: string) => blogPostsTable.get(postId);

/**
 * The post at `slug`, or `null`. Unpublished posts are only returned when `includeUnpublished` is
 * set, and (with row security on) only to admins regardless.
 */
export const getPostBySlug = (slug: string, { includeUnpublished = false } = {}) =>
    blogPostsTable.first([
        Query.equal('slug', slug),
        ...(includeUnpublished ? [] : [Query.equal('published', true)]),
    ]);

const slugTaken = (slug: string) =>
    new ApiError('conflict', `Another post already uses the slug "${slug}".`, {
        fieldErrors: { slug: 'Another post already uses this slug' },
    });

const pickEditable = ({ title, slug, summary, content, publishedDate, published, tags, coverImageId }: BlogPost) => ({
    title,
    slug,
    summary,
    content,
    publishedDate,
    published,
    tags,
    coverImageId,
});

/**
 * Creates a post or updates `current`, swapping the cover image if `cover` asks for it.
 *
 * Slugs are unique: checked up front for a friendly message, and enforced by a unique index for the
 * race where two saves pick the same slug at once. Updates are refused if the post was edited
 * elsewhere after `current` was loaded (view-count changes don't count).
 */
export async function savePost({
    current,
    values,
    cover,
}: {
    current: BlogPost | null;
    values: BlogPostInput;
    cover: FileChange;
}): Promise<BlogPost> {
    const data = parseInput(blogPostInputSchema, values);
    const slugOwner = await getPostBySlug(data.slug, { includeUnpublished: true });

    if (slugOwner && slugOwner.$id !== current?.$id) {
        throw slugTaken(data.slug);
    }

    const permissions = publicReadWhen(data.published);

    return swapFile({
        currentFileId: current?.coverImageId ?? null,
        change: cover,
        kind: 'image',
        folder: FOLDERS.blogCovers,
        commit: async (coverImageId) => {
            try {
                return current
                    ? await blogPostsTable.update(
                          current.$id,
                          { ...data, coverImageId },
                          { permissions, expected: pickEditable(current) }
                      )
                    : await blogPostsTable.create({ ...data, coverImageId, viewCount: 0 }, { permissions });
            } catch (error) {
                const apiError = toApiError(error);
                // A 409 from Appwrite here can only come from the unique slug index.
                throw apiError.kind === 'conflict' && apiError.status === 409 ? slugTaken(data.slug) : apiError;
            }
        },
    });
}

export const setPostPublished = (post: BlogPost, published: boolean) =>
    blogPostsTable.update(post.$id, { published }, { permissions: publicReadWhen(published) });

/** Deletes the post and its cover. Images inside the body stay in the media library. */
export async function deletePost(post: BlogPost) {
    await blogPostsTable.remove(post.$id);
    await deleteFileQuietly(post.coverImageId);
}

/**
 * Counts one view of a published post. Guests can't write to the blogs table, so this calls the
 * `record-blog-view` Appwrite Function (appwrite/functions/record-blog-view), which checks the post
 * is published and increments its counter atomically. Runs asynchronously; nothing to wait for.
 */
export const recordPostView = (postId: string) =>
    withApiErrors('Record blog view', async () => {
        const { functions, config } = getBackend();

        await functions.createExecution({
            functionId: config.functions.recordBlogView,
            body: JSON.stringify({ postId }),
            async: true,
        });
    });
