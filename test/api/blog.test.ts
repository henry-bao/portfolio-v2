import { beforeEach, describe, expect, test } from 'bun:test';
import { fakeAppwrite, resetFakeAppwrite } from '../fakeBackend';
import {
    blogPostInputSchema,
    deletePost,
    getPostBySlug,
    listPublishedPosts,
    recordPostView,
    savePost,
    setPostPublished,
    slugify,
} from '../../src/api/blog';
import type { BlogPostInput } from '../../src/api/blog';
import { KEEP_FILE } from '../../src/api/core/files';
import { isApiError } from '../../src/api/core/errors';

const PUBLIC_READ = 'read("any")';

const values = (overrides: Partial<BlogPostInput> = {}): BlogPostInput => ({
    title: 'Hello World',
    slug: 'hello-world',
    summary: 'A summary',
    content: '# Hello',
    publishedDate: '2026-02-03',
    published: false,
    tags: ['news'],
    ...overrides,
});

const image = () => new File(['png'], 'cover.png', { type: 'image/png' });

beforeEach(() => {
    resetFakeAppwrite({ uniqueColumns: { blogs: ['slug'] } });
});

describe('slugify', () => {
    test.each([
        ['Héllo, World!', 'hello-world'],
        ['  --Already--Dashed--  ', 'already-dashed'],
        ['Ünïcödé & Émojis 🎉 2026', 'unicode-emojis-2026'],
        ['!!!', ''],
    ])('%s → %s', (title, slug) => {
        expect(slugify(title)).toBe(slug);
    });
});

describe('blogPostInputSchema', () => {
    test('rejects the reserved "preview" slug', () => {
        const result = blogPostInputSchema.safeParse(values({ slug: 'preview' }));
        expect(result.success).toBe(false);
    });

    test('rejects slugs a URL would mangle', () => {
        expect(blogPostInputSchema.safeParse(values({ slug: 'two  words' })).success).toBe(false);
        expect(blogPostInputSchema.safeParse(values({ slug: 'trailing-' })).success).toBe(false);
    });

    test('normalizes case in slugs and stores the date as ISO', () => {
        const parsed = blogPostInputSchema.parse(values({ slug: 'Hello-World' }));
        expect(parsed.slug).toBe('hello-world');
        expect(parsed.publishedDate).toBe('2026-02-03T00:00:00.000Z');
    });
});

describe('savePost', () => {
    test('creates a draft that guests cannot read, then publishing makes it public', async () => {
        const draft = await savePost({ current: null, values: values(), cover: KEEP_FILE });
        expect(draft.$permissions).not.toContain(PUBLIC_READ);
        expect(draft.viewCount).toBe(0);

        const published = await setPostPublished(draft, true);
        expect(published.$permissions).toContain(PUBLIC_READ);

        const unpublished = await setPostPublished(published, false);
        expect(unpublished.$permissions).not.toContain(PUBLIC_READ);
    });

    test('refuses a slug another post already uses, with a field error', async () => {
        await savePost({ current: null, values: values(), cover: KEEP_FILE });

        const error = await savePost({ current: null, values: values({ title: 'Other' }), cover: KEEP_FILE }).catch(
            (caught: unknown) => caught
        );

        expect(isApiError(error, 'conflict')).toBe(true);
        expect((error as { fieldErrors: Record<string, string> }).fieldErrors.slug).toBeDefined();
    });

    test('an existing post can keep its own slug', async () => {
        const post = await savePost({ current: null, values: values(), cover: KEEP_FILE });
        const saved = await savePost({ current: post, values: values({ title: 'Renamed' }), cover: KEEP_FILE });

        expect(saved.title).toBe('Renamed');
    });

    test('replacing the cover uploads the new one before deleting the old one', async () => {
        const post = await savePost({ current: null, values: values(), cover: { type: 'replace', file: image() } });
        const firstCover = post.coverImageId!;

        const saved = await savePost({ current: post, values: values(), cover: { type: 'replace', file: image() } });

        expect(saved.coverImageId).not.toBe(firstCover);
        expect(fakeAppwrite().files.has(firstCover)).toBe(false);
        expect(fakeAppwrite().files.get(saved.coverImageId!)?.folder).toBe('blog-covers/');
    });

    test('a failed save removes the freshly uploaded cover and keeps the old one', async () => {
        const post = await savePost({ current: null, values: values(), cover: { type: 'replace', file: image() } });
        await savePost({ current: null, values: values({ slug: 'taken' }), cover: KEEP_FILE });

        await savePost({ current: post, values: values({ slug: 'taken' }), cover: { type: 'replace', file: image() } }).catch(
            () => {}
        );

        expect([...fakeAppwrite().files.keys()]).toEqual([post.coverImageId!]);
    });

    test('refuses to overwrite edits made elsewhere, but ignores view-count changes', async () => {
        const post = await savePost({ current: null, values: values({ published: true }), cover: KEEP_FILE });

        // A view arrives (bumps viewCount and $updatedAt): saving must still work.
        fakeAppwrite().rows('blogs')[0].viewCount = 7;
        const saved = await savePost({ current: post, values: values({ published: true, summary: 'v2' }), cover: KEEP_FILE });
        expect(saved.summary).toBe('v2');

        // Someone else edits the content: saving the stale copy must fail.
        fakeAppwrite().rows('blogs')[0].content = 'changed in another tab';
        const error = await savePost({ current: saved, values: values({ summary: 'v3' }), cover: KEEP_FILE }).catch(
            (caught: unknown) => caught
        );
        expect(isApiError(error, 'conflict')).toBe(true);
    });

    test('rejects invalid input with per-field messages and writes nothing', async () => {
        const error = await savePost({ current: null, values: values({ title: '', content: '' }), cover: KEEP_FILE }).catch(
            (caught: unknown) => caught
        );

        expect(isApiError(error, 'invalid_input')).toBe(true);
        expect(Object.keys((error as { fieldErrors: object }).fieldErrors).sort()).toEqual(['content', 'title']);
        expect(fakeAppwrite().rows('blogs')).toHaveLength(0);
    });
});

test('public reads only return published posts', async () => {
    await savePost({ current: null, values: values({ slug: 'draft' }), cover: KEEP_FILE });
    await savePost({ current: null, values: values({ slug: 'live', published: true }), cover: KEEP_FILE });

    expect((await listPublishedPosts()).map((post) => post.slug)).toEqual(['live']);
    expect(await getPostBySlug('draft')).toBeNull();
    expect((await getPostBySlug('draft', { includeUnpublished: true }))?.slug).toBe('draft');
});

test('deleting a post deletes its cover', async () => {
    const post = await savePost({ current: null, values: values(), cover: { type: 'replace', file: image() } });

    await deletePost(post);

    expect(fakeAppwrite().rows('blogs')).toHaveLength(0);
    expect(fakeAppwrite().files.size).toBe(0);
});

test('recordPostView runs the view-count function asynchronously', async () => {
    await recordPostView('post-1');

    expect(fakeAppwrite().executions).toEqual([
        { functionId: 'record-blog-view', body: JSON.stringify({ postId: 'post-1' }), async: true },
    ]);
});
