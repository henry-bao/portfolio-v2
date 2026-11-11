import { draftsApi } from '../../../api';
import type { BlogDraft, BlogPost } from '../../../api';

/** One row of the dashboard's post list: a saved post (maybe with local edits) or a never-saved draft. */
export type BlogListItem =
    | { kind: 'post'; id: string; post: BlogPost; draft: BlogDraft | null }
    | { kind: 'draft'; id: string; draft: BlogDraft };

const sortTime = (item: BlogListItem) => {
    const date = item.draft?.lastSaved ?? (item.kind === 'post' ? item.post.publishedDate : '');
    const time = Date.parse(date);
    return Number.isNaN(time) ? 0 : time;
};

/**
 * Saved posts plus drafts of posts that were never saved, most recently touched first.
 * Drafts whose post no longer exists are left out.
 */
export function buildBlogListItems(posts: BlogPost[], drafts: BlogDraft[]): BlogListItem[] {
    const draftsById = new Map(drafts.map((draft) => [draft.id, draft]));

    const items: BlogListItem[] = [
        ...posts.map((post) => ({ kind: 'post' as const, id: post.$id, post, draft: draftsById.get(post.$id) ?? null })),
        ...drafts
            .filter((draft) => draftsApi.postIdOfDraft(draft.id) === null)
            .map((draft) => ({ kind: 'draft' as const, id: draft.id, draft })),
    ];

    return items.sort((a, b) => sortTime(b) - sortTime(a));
}

export const itemTitle = (item: BlogListItem) =>
    item.kind === 'post' ? item.post.title : item.draft.title.trim() || 'Untitled draft';

const itemSummary = (item: BlogListItem) => (item.kind === 'post' ? item.post.summary : item.draft.summary);

export const itemTags = (item: BlogListItem) => (item.kind === 'post' ? item.post.tags : item.draft.tags);

export function matchesSearch(item: BlogListItem, searchTerm: string) {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
        return true;
    }

    return (
        itemTitle(item).toLowerCase().includes(term) ||
        itemSummary(item).toLowerCase().includes(term) ||
        itemTags(item).some((tag) => tag.toLowerCase().includes(term))
    );
}
