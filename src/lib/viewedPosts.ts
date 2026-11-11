import { z } from 'zod';
import { readStoredJson, writeStoredJson } from './browserStorage';

/**
 * Remembers which posts this browser already counted, so a reader refreshing a post doesn't inflate
 * its view count. One view per post per day per browser.
 */
const STORAGE_KEY = 'henry-blog-viewed-posts';
const COUNT_AGAIN_AFTER_MS = 24 * 60 * 60 * 1000;

/** A view only counts once the reader has stayed on the post this long. */
export const VIEW_COUNT_DELAY_MS = 10_000;

const viewedSchema = z.record(z.string(), z.number());

/** Returns whether this view should be counted, and records it if so. */
export function claimPostView(postId: string, now = Date.now()): boolean {
    const viewed = readStoredJson(STORAGE_KEY, viewedSchema, {});
    const lastViewedAt = viewed[postId];

    if (lastViewedAt !== undefined && now - lastViewedAt < COUNT_AGAIN_AFTER_MS) {
        return false;
    }

    // Drop expired entries while we're here, so the map can't grow forever.
    const recent = Object.fromEntries(
        Object.entries(viewed).filter(([, viewedAt]) => now - viewedAt < COUNT_AGAIN_AFTER_MS)
    );

    writeStoredJson(STORAGE_KEY, { ...recent, [postId]: now });
    return true;
}
