import { z } from 'zod';
import { readStoredJson, readStoredRaw, writeStoredJson } from '../lib/browserStorage';

/**
 * Autosaved blog drafts, kept in this browser's local storage (not in Appwrite).
 *
 * A draft for an existing post uses the post's id; a draft for a post that was never saved uses a
 * `new-…` id. Drafts hold text fields only: a newly picked cover image can't be stored locally, so
 * only "remove the cover" survives a reload.
 */

/** Same key as earlier versions of the app, so existing drafts keep loading. */
const STORAGE_KEY = 'blog_drafts';
const NEW_DRAFT_PREFIX = 'new-';

const draftSchema = z.preprocess(
    // Drafts written by the previous version stored `hasCoverImage: false` for a removed cover.
    (value) =>
        value && typeof value === 'object' && !('removeCover' in value)
            ? { ...value, removeCover: (value as { hasCoverImage?: unknown }).hasCoverImage === false }
            : value,
    z.object({
        id: z.string().min(1),
        title: z.string().catch(''),
        content: z.string().catch(''),
        summary: z.string().catch(''),
        slug: z.string().catch(''),
        publishedDate: z.string().catch(''),
        published: z.boolean().catch(false),
        tags: z.array(z.string()).catch([]),
        removeCover: z.boolean().catch(false),
        lastSaved: z.string().catch(() => new Date(0).toISOString()),
    })
);

export type BlogDraft = z.output<typeof draftSchema>;

/** Unreadable entries are dropped one by one, never the whole list. */
const draftListSchema = z.array(z.unknown()).transform((entries) =>
    entries.flatMap((entry) => {
        const result = draftSchema.safeParse(entry);
        return result.success ? [result.data] : [];
    })
);

export const newDraftId = () => `${NEW_DRAFT_PREFIX}${crypto.randomUUID()}`;

/** `null` for drafts of posts that were never saved. */
export const postIdOfDraft = (draftId: string) => (draftId.startsWith(NEW_DRAFT_PREFIX) ? null : draftId);

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedDrafts: BlogDraft[] = [];

/** Newest first. Returns the same array until storage changes, as `useSyncExternalStore` requires. */
export function listDrafts(): BlogDraft[] {
    const raw = readStoredRaw(STORAGE_KEY);

    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedDrafts = readStoredJson(STORAGE_KEY, draftListSchema, []).sort((a, b) =>
            b.lastSaved.localeCompare(a.lastSaved)
        );
    }

    return cachedDrafts;
}

export const getDraft = (draftId: string) => listDrafts().find((draft) => draft.id === draftId) ?? null;

const writeDrafts = (drafts: BlogDraft[]) => {
    const saved = writeStoredJson(STORAGE_KEY, drafts);
    listeners.forEach((listener) => listener());
    return saved;
};

/** Inserts or replaces the draft. Returns `false` when local storage is full or unavailable. */
export const saveDraft = (draft: BlogDraft) =>
    writeDrafts([draft, ...listDrafts().filter((stored) => stored.id !== draft.id)]);

export const deleteDraft = (draftId: string) => {
    if (getDraft(draftId)) {
        writeDrafts(listDrafts().filter((draft) => draft.id !== draftId));
    }
};

/** Notifies on changes from this tab and from other tabs. */
export function subscribeToDrafts(listener: () => void) {
    const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY || event.key === null) {
            listener();
        }
    };

    listeners.add(listener);
    window.addEventListener('storage', onStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}
