import { beforeEach, describe, expect, test } from 'bun:test';
import { deleteDraft, getDraft, listDrafts, newDraftId, postIdOfDraft, saveDraft, subscribeToDrafts } from '../../src/api/drafts';
import type { BlogDraft } from '../../src/api/drafts';
import { claimPostView } from '../../src/lib/viewedPosts';

const DRAFTS_KEY = 'blog_drafts';

const draft = (overrides: Partial<BlogDraft> = {}): BlogDraft => ({
    id: 'post-1',
    title: 'Title',
    content: 'Body',
    summary: 'Summary',
    slug: 'title',
    publishedDate: '2026-01-01',
    published: false,
    tags: [],
    removeCover: false,
    lastSaved: '2026-01-01T00:00:00.000Z',
    ...overrides,
});

beforeEach(() => {
    localStorage.clear();
});

describe('drafts', () => {
    test('round-trips, replaces by id, and lists newest first', () => {
        saveDraft(draft({ id: 'a', lastSaved: '2026-01-01T00:00:00.000Z' }));
        saveDraft(draft({ id: 'b', lastSaved: '2026-01-02T00:00:00.000Z' }));
        saveDraft(draft({ id: 'a', title: 'Edited', lastSaved: '2026-01-03T00:00:00.000Z' }));

        expect(listDrafts().map((stored) => [stored.id, stored.title])).toEqual([
            ['a', 'Edited'],
            ['b', 'Title'],
        ]);
    });

    test('reads drafts saved by the previous version of the app', () => {
        localStorage.setItem(
            DRAFTS_KEY,
            JSON.stringify([
                {
                    id: 'new-1700000000000',
                    title: 'Old draft',
                    content: 'x',
                    summary: 'y',
                    slug: 'old-draft',
                    publishedDate: '2025-01-01',
                    tags: ['a'],
                    lastSaved: '2025-01-01T00:00:00.000Z',
                    hasCoverImage: false,
                    coverImageUrl: 'blob:http://localhost/dead',
                },
            ])
        );

        const [legacy] = listDrafts();

        expect(legacy.title).toBe('Old draft');
        expect(legacy.removeCover).toBe(true);
        expect(postIdOfDraft(legacy.id)).toBeNull();
    });

    test('skips unreadable entries and survives corrupt storage', () => {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify([draft(), { nope: true }, 'garbage']));
        expect(listDrafts().map((stored) => stored.id)).toEqual(['post-1']);

        localStorage.setItem(DRAFTS_KEY, '{not json');
        expect(listDrafts()).toEqual([]);
    });

    test('returns the same array until storage changes (required by useSyncExternalStore)', () => {
        saveDraft(draft());
        expect(listDrafts()).toBe(listDrafts());
    });

    test('notifies subscribers and deletes by id', () => {
        let notifications = 0;
        const unsubscribe = subscribeToDrafts(() => {
            notifications += 1;
        });

        saveDraft(draft());
        deleteDraft('post-1');
        deleteDraft('post-1');
        unsubscribe();

        expect(notifications).toBe(2);
        expect(getDraft('post-1')).toBeNull();
    });

    test('new-post draft ids are unique and never mistaken for post ids', () => {
        const first = newDraftId();
        expect(first).not.toBe(newDraftId());
        expect(postIdOfDraft(first)).toBeNull();
        expect(postIdOfDraft('67e8e1b1003c869318d6')).toBe('67e8e1b1003c869318d6');
    });
});

describe('claimPostView', () => {
    const DAY = 24 * 60 * 60 * 1000;

    test('counts once per post per day', () => {
        const now = Date.parse('2026-01-01T00:00:00.000Z');

        expect(claimPostView('p1', now)).toBe(true);
        expect(claimPostView('p1', now + 1000)).toBe(false);
        expect(claimPostView('p2', now + 1000)).toBe(true);
        expect(claimPostView('p1', now + DAY)).toBe(true);
    });

    test('forgets expired entries so storage does not grow forever', () => {
        const now = Date.parse('2026-01-01T00:00:00.000Z');
        claimPostView('old', now);
        claimPostView('new', now + 2 * DAY);

        expect(Object.keys(JSON.parse(localStorage.getItem('henry-blog-viewed-posts') ?? '{}'))).toEqual(['new']);
    });

    test('recovers from corrupt storage', () => {
        localStorage.setItem('henry-blog-viewed-posts', '"not an object"');
        expect(claimPostView('p1')).toBe(true);
    });
});
